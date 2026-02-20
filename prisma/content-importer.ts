import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import matter from 'gray-matter'

function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || 'file:./prisma/dev.db'
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: resolveDatabaseUrl(),
  }),
})

interface PathFrontmatter {
  id: string
  title: string
  description: string
  icon: string
  estimatedHours: number
  difficulty: string
}

interface CourseFrontmatter {
  id: string
  title: string
  description: string
  difficulty: string
  durationHours: number
  pathId: string
}

interface LessonFrontmatter {
  id: string
  title: string
  type: string
  duration: string
  order: number
  section: string
  prevLessonId?: string
  nextLessonId?: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface ImportedCourseMeta {
  id: string
  title: string
  description: string
  learningOutcomes: string[]
  prerequisites: string[]
}

interface LessonSeedData {
  id: string
  title: string
  type: 'lesson' | 'project' | 'quiz'
  duration: string
  order: number
  sectionSlug: string
  content: string
  prevLessonId?: string
  nextLessonId?: string
}

function deterministicUuid(input: string): string {
  const hash = createHash('sha1').update(input).digest('hex')

  const part1 = hash.slice(0, 8)
  const part2 = hash.slice(8, 12)
  const part3 = `5${hash.slice(13, 16)}`
  const variantSeed = parseInt(hash.slice(16, 18), 16)
  const part4 = `${((variantSeed & 0x3f) | 0x80).toString(16).padStart(2, '0')}${hash.slice(18, 20)}`
  const part5 = hash.slice(20, 32)

  return `${part1}-${part2}-${part3}-${part4}-${part5}`
}

function sectionTitleFromSlug(sectionSlug: string): string {
  return sectionSlug
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function extractBulletItems(content: string, heading: string): string[] {
  const pattern = new RegExp(`## ${heading}\\s*([\\s\\S]*?)(?=\\n## |$)`, 'i')
  const match = content.match(pattern)
  if (!match) return []

  const bullets = match[1].match(/^-\s+(.+)$/gm)
  if (!bullets) return []

  return bullets.map(item => item.replace(/^-\s+/, '').trim())
}

function buildFallbackLessons(course: ImportedCourseMeta): LessonSeedData[] {
  const foundationalId = deterministicUuid(`${course.id}:lesson:foundation`)
  const conceptsId = deterministicUuid(`${course.id}:lesson:concepts`)
  const practiceId = deterministicUuid(`${course.id}:lesson:practice`)

  const outcomes = course.learningOutcomes.length > 0
    ? course.learningOutcomes
    : [
        'Understand the core concepts covered in this course',
        'Apply what you learn to realistic scenarios',
        'Build confidence through deliberate practice',
      ]

  const prerequisites = course.prerequisites.length > 0
    ? course.prerequisites
    : ['No strict prerequisites - bring curiosity and consistency.']

  const introContent = `
# ${course.title}: Orientation

## Why This Course Matters
${course.description}

## Learning Outcomes
${outcomes.map(item => `- ${item}`).join('\n')}

## Prerequisites
${prerequisites.map(item => `- ${item}`).join('\n')}

## First Week Plan
1. Review this orientation and map your schedule.
2. Move to the core concepts lesson.
3. Complete the practice sprint to lock in learning.

## Knowledge Check
1. What is the best first step to gain momentum in this course?
   - Schedule consistent study blocks and complete lessons in order.
   - Skip directly to advanced topics and review basics later.
   - Wait until you have large free weekends before starting.
   - Read only summaries and avoid hands-on work.
`

  const conceptsContent = `
# Core Concepts Workshop

## Concept Map
This workshop connects the most important ideas in ${course.title} and shows how they support practical execution.

## Practical Anchors
- Focus on one concept at a time, then test it with a small implementation.
- Capture what worked, what failed, and what to improve next.
- Use discussions and feedback loops to close knowledge gaps quickly.

## Applied Mini-Exercise
Create a short implementation plan for one concept from this course. Include:
- Goal
- Tools
- Success criteria
- Estimated time

## Knowledge Check
1. Which learning approach usually creates the strongest retention?
   - Practice a concept immediately after learning it.
   - Consume multiple lessons passively before applying anything.
   - Memorize terminology without implementation.
   - Delay all practice until the end of the course.
`

  const practiceContent = `
# Practice Sprint Project

## Sprint Objective
Use what you learned in ${course.title} to produce a small but concrete outcome.

## Deliverables
- One project artifact that demonstrates a core skill
- A short reflection on what you learned
- A list of improvements for your next iteration

## Suggested Workflow
1. Choose a narrow scope.
2. Build a first version quickly.
3. Gather feedback and improve.
4. Document your lessons learned.

## Knowledge Check
1. What indicates the sprint was successful?
   - You shipped a working artifact and documented what improved your skill.
   - You consumed all material without building anything.
   - You postponed delivery until everything felt perfect.
   - You avoided feedback to keep momentum.
`

  return [
    {
      id: foundationalId,
      title: `${course.title}: Orientation`,
      type: 'lesson',
      duration: '25 min',
      order: 1,
      sectionSlug: 'foundations',
      content: introContent.trim(),
      nextLessonId: conceptsId,
    },
    {
      id: conceptsId,
      title: 'Core Concepts Workshop',
      type: 'lesson',
      duration: '35 min',
      order: 2,
      sectionSlug: 'foundations',
      content: conceptsContent.trim(),
      prevLessonId: foundationalId,
      nextLessonId: practiceId,
    },
    {
      id: practiceId,
      title: 'Practice Sprint Project',
      type: 'project',
      duration: '45 min',
      order: 3,
      sectionSlug: 'applied-practice',
      content: practiceContent.trim(),
      prevLessonId: conceptsId,
    },
  ]
}

/**
 * Parse quiz questions from a Knowledge Check section in markdown
 */
function parseQuizQuestions(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = []

  // Find the Knowledge Check section
  const knowledgeCheckMatch = content.match(/## Knowledge Check\s*([\s\S]*?)(?=\n## |$)/i)
  if (!knowledgeCheckMatch) return questions

  const knowledgeCheckContent = knowledgeCheckMatch[1]

  // Match questions (numbered like "1. Question text?")
  const questionBlocks = knowledgeCheckContent.split(/\n(?=\d+\.\s+)/)

  for (const block of questionBlocks) {
    if (!block.trim()) continue

    // Extract question text
    const questionPattern = new RegExp('^\\d+\\.\\s+([\\s\\S]+?)(?=\\n\\s*-)')
    const questionMatch = block.match(questionPattern)
    if (!questionMatch) continue

    const question = questionMatch[1].trim()

    // Extract options (lines starting with -)
    const optionMatches = block.match(/^\s*-\s+(.+)$/gm)
    if (!optionMatches || optionMatches.length < 2) continue

    const options = optionMatches.map(opt => opt.replace(/^\s*-\s+/, '').replace(/`/g, '').trim())

    // For now, assume first option is correct (we can enhance this later with markers like [x])
    // In a real implementation, you'd mark correct answers in markdown like:
    // - [x] Correct answer
    // - [ ] Wrong answer
    questions.push({
      question,
      options,
      correctAnswer: 0, // Default to first option
      explanation: `The correct answer is: ${options[0]}`
    })
  }

  return questions
}

/**
 * Import learning paths from markdown files
 */
async function importPaths() {
  const pathsDir = path.join(process.cwd(), 'content', 'paths')

  if (!fs.existsSync(pathsDir)) {
    console.log('❌ Paths directory not found')
    return
  }

  const pathFiles = fs.readdirSync(pathsDir).filter(f => f.endsWith('.md'))

  console.log(`\n📚 Importing ${pathFiles.length} learning paths...`)

  for (const file of pathFiles) {
    const filePath = path.join(pathsDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const parsed = matter(fileContent)
    const data = parsed.data as PathFrontmatter

    await prisma.path.upsert({
      where: { id: data.id },
      update: {
        title: data.title,
        description: data.description,
        icon: data.icon,
        estimatedHours: data.estimatedHours,
        difficulty: data.difficulty,
      },
      create: {
        id: data.id,
        title: data.title,
        description: data.description,
        icon: data.icon,
        estimatedHours: data.estimatedHours,
        difficulty: data.difficulty,
      },
    })

    console.log(`  ✅ Imported path: ${data.title}`)
  }
}

/**
 * Import courses from markdown files
 */
async function importCourses(): Promise<ImportedCourseMeta[]> {
  const coursesDir = path.join(process.cwd(), 'content', 'courses')

  if (!fs.existsSync(coursesDir)) {
    console.log('❌ Courses directory not found')
    return []
  }

  const courseFiles = fs.readdirSync(coursesDir).filter(f => f.endsWith('.md'))
  const importedCourses: ImportedCourseMeta[] = []

  console.log(`\n📖 Importing ${courseFiles.length} courses...`)

  for (const file of courseFiles) {
    const filePath = path.join(coursesDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const parsed = matter(fileContent)
    const data = parsed.data as CourseFrontmatter
    const content = parsed.content

    // Validate difficulty enum
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced']
    const difficulty = validDifficulties.includes(data.difficulty) ? data.difficulty : 'Beginner'

    const learningOutcomes = extractBulletItems(content, 'Learning Outcomes')
    const prerequisites = extractBulletItems(content, 'Prerequisites')

    await prisma.course.upsert({
      where: { id: data.id },
      update: {
        title: data.title,
        description: data.description,
        difficulty: difficulty as any,
        durationHours: data.durationHours,
        pathId: data.pathId,
        learningOutcomes: JSON.stringify(learningOutcomes),
        prerequisites: JSON.stringify(prerequisites),
      },
      create: {
        id: data.id,
        title: data.title,
        description: data.description,
        difficulty: difficulty as any,
        durationHours: data.durationHours,
        pathId: data.pathId,
        learningOutcomes: JSON.stringify(learningOutcomes),
        prerequisites: JSON.stringify(prerequisites),
      },
    })

    console.log(`  ✅ Imported course: ${data.title}`)

    importedCourses.push({
      id: data.id,
      title: data.title,
      description: data.description,
      learningOutcomes,
      prerequisites,
    })
  }

  return importedCourses
}

/**
 * Import lessons from markdown files
 */
async function importLessons(courses: ImportedCourseMeta[]) {
  const coursesDir = path.join(process.cwd(), 'content', 'courses')

  if (!fs.existsSync(coursesDir)) {
    console.log('❌ Courses directory not found')
    return
  }

  console.log(`\n📝 Importing lessons...`)

  // Find all course directories
  const courseDirectories = fs.readdirSync(coursesDir).filter(f => {
    const fullPath = path.join(coursesDir, f)
    return fs.statSync(fullPath).isDirectory()
  })

  for (const courseDir of courseDirectories) {
    const lessonsDir = path.join(coursesDir, courseDir, 'lessons')

    if (!fs.existsSync(lessonsDir)) continue

    const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.md'))

    for (const lessonFile of lessonFiles) {
      const filePath = path.join(lessonsDir, lessonFile)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const parsed = matter(fileContent)
      const data = parsed.data as LessonFrontmatter
      const content = parsed.content

      const lessonId = (() => {
        const maybeId = (data.id || '').trim()
        if (!maybeId) return deterministicUuid(`${courseDir}:${lessonFile}`)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(maybeId)
        return isUuid ? maybeId : deterministicUuid(`${courseDir}:${maybeId}`)
      })()

      // Validate lesson type
      const validTypes = ['lesson', 'project', 'quiz']
      const lessonType = validTypes.includes(data.type) ? data.type : 'lesson'

      // Create section if it doesn't exist
      const sectionId = `${courseDir}-${data.section}`
      await prisma.courseSection.upsert({
        where: { id: sectionId },
        update: {},
        create: {
          id: sectionId,
          title: sectionTitleFromSlug(data.section),
          description: `Learn about ${data.section.replace(/-/g, ' ')}`,
          order: data.order || 1,
          courseId: courseDir,
        },
      })

      // Create lesson
      const lesson = await prisma.lesson.upsert({
        where: { id: lessonId },
        update: {
          title: data.title,
          content,
          type: lessonType as any,
          duration: data.duration,
          prevLessonId: data.prevLessonId || null,
          nextLessonId: data.nextLessonId || null,
          sectionId: sectionId,
        },
        create: {
          id: lessonId,
          title: data.title,
          content,
          type: lessonType as any,
          duration: data.duration,
          prevLessonId: data.prevLessonId || null,
          nextLessonId: data.nextLessonId || null,
          sectionId: sectionId,
        },
      })

      console.log(`  ✅ Imported lesson: ${data.title}`)

      // Parse and import quiz questions
      const quizQuestions = parseQuizQuestions(content)

      if (quizQuestions.length > 0) {
        console.log(`    📋 Found ${quizQuestions.length} quiz questions`)

        for (let i = 0; i < quizQuestions.length; i++) {
          const quiz = quizQuestions[i]
          const quizId = deterministicUuid(`${lesson.id}:quiz:${i + 1}`)

          await prisma.quizQuestion.upsert({
            where: { id: quizId },
            update: {
              question: quiz.question,
              options: JSON.stringify(quiz.options),
              correctAnswer: quiz.correctAnswer,
              explanation: quiz.explanation,
              lessonId: lesson.id,
            },
            create: {
              id: quizId,
              question: quiz.question,
              options: JSON.stringify(quiz.options),
              correctAnswer: quiz.correctAnswer,
              explanation: quiz.explanation || '',
              lessonId: lesson.id,
            },
          })
        }
      }
    }
  }

  // Generate a starter curriculum if a course has no authored lesson files yet.
  for (const course of courses) {
    const existingLessonCount = await prisma.lesson.count({
      where: {
        section: {
          courseId: course.id,
        },
      },
    })

    if (existingLessonCount > 0) {
      continue
    }

    const fallbackLessons = buildFallbackLessons(course)
    const sectionOrder = new Map<string, number>([
      ['foundations', 1],
      ['applied-practice', 2],
    ])

    for (const fallback of fallbackLessons) {
      const sectionId = `${course.id}-${fallback.sectionSlug}`
      const sectionOrderValue = sectionOrder.get(fallback.sectionSlug) || fallback.order

      await prisma.courseSection.upsert({
        where: { id: sectionId },
        update: {},
        create: {
          id: sectionId,
          title: sectionTitleFromSlug(fallback.sectionSlug),
          description: `Auto-generated starter section for ${course.title}`,
          order: sectionOrderValue,
          courseId: course.id,
        },
      })

      const lesson = await prisma.lesson.upsert({
        where: { id: fallback.id },
        update: {
          title: fallback.title,
          content: fallback.content,
          type: fallback.type,
          duration: fallback.duration,
          prevLessonId: fallback.prevLessonId || null,
          nextLessonId: fallback.nextLessonId || null,
          sectionId,
        },
        create: {
          id: fallback.id,
          title: fallback.title,
          content: fallback.content,
          type: fallback.type,
          duration: fallback.duration,
          prevLessonId: fallback.prevLessonId || null,
          nextLessonId: fallback.nextLessonId || null,
          sectionId,
        },
      })

      const quizQuestions = parseQuizQuestions(fallback.content)
      for (let i = 0; i < quizQuestions.length; i++) {
        const quiz = quizQuestions[i]
        const quizId = deterministicUuid(`${lesson.id}:quiz:${i + 1}`)

        await prisma.quizQuestion.upsert({
          where: { id: quizId },
          update: {
            question: quiz.question,
            options: JSON.stringify(quiz.options),
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation,
            lessonId: lesson.id,
          },
          create: {
            id: quizId,
            question: quiz.question,
            options: JSON.stringify(quiz.options),
            correctAnswer: quiz.correctAnswer,
            explanation: quiz.explanation || '',
            lessonId: lesson.id,
          },
        })
      }
    }

    console.log(`  ✅ Generated starter lessons for course: ${course.title}`)
  }
}

/**
 * Main import function
 */
export async function importContent() {
  console.log('🚀 Starting content import...\n')

  try {
    await importPaths()
    const courses = await importCourses()
    await importLessons(courses)

    console.log('\n✨ Content import completed successfully!')
  } catch (error) {
    console.error('❌ Error during content import:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  importContent()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
