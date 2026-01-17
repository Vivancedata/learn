import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const prisma = new PrismaClient()

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
async function importCourses() {
  const coursesDir = path.join(process.cwd(), 'content', 'courses')

  if (!fs.existsSync(coursesDir)) {
    console.log('❌ Courses directory not found')
    return
  }

  const courseFiles = fs.readdirSync(coursesDir).filter(f => f.endsWith('.md'))

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

    // Extract learning outcomes from content
    const learningOutcomesPattern = new RegExp('## Learning Outcomes\\s*([\\s\\S]*?)(?=\\n## |$)', 'i')
    const learningOutcomesMatch = content.match(learningOutcomesPattern)
    const learningOutcomes: string[] = []

    if (learningOutcomesMatch) {
      const outcomesText = learningOutcomesMatch[1]
      const outcomes = outcomesText.match(/^-\s+(.+)$/gm)
      if (outcomes) {
        learningOutcomes.push(...outcomes.map(o => o.replace(/^-\s+/, '').trim()))
      }
    }

    // Extract prerequisites from content
    const prerequisitesPattern = new RegExp('## Prerequisites\\s*([\\s\\S]*?)(?=\\n## |$)', 'i')
    const prerequisitesMatch = content.match(prerequisitesPattern)
    const prerequisites: string[] = []

    if (prerequisitesMatch) {
      const prereqText = prerequisitesMatch[1]
      const prereqs = prereqText.match(/^-\s+(.+)$/gm)
      if (prereqs) {
        prerequisites.push(...prereqs.map(p => p.replace(/^-\s+/, '').trim()))
      }
    }

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
  }
}

/**
 * Import lessons from markdown files
 */
async function importLessons() {
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
          title: data.section.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          description: `Learn about ${data.section.replace(/-/g, ' ')}`,
          order: data.order || 1,
          courseId: courseDir,
        },
      })

      // Create lesson
      const lesson = await prisma.lesson.upsert({
        where: { id: data.id },
        update: {
          title: data.title,
          content: content,
          type: lessonType as any,
          duration: data.duration,
          sectionId: sectionId,
        },
        create: {
          id: data.id,
          title: data.title,
          content: content,
          type: lessonType as any,
          duration: data.duration,
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
          const quizId = `${data.id}-quiz-${i + 1}`

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
}

/**
 * Main import function
 */
export async function importContent() {
  console.log('🚀 Starting content import...\n')

  try {
    await importPaths()
    await importCourses()
    await importLessons()

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
