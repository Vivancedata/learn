/**
 * Database seeding script using better-sqlite3
 * This bypasses Prisma client generation issues by directly using SQLite
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { hash } from 'bcryptjs'
import { randomUUID, createHash } from 'crypto'

declare const require: (id: string) => any

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
const CONTENT_DIR = path.join(process.cwd(), 'content')

function loadSqliteDriver() {
  try {
    return require('better-sqlite3')
  } catch (error) {
    throw new Error(
      'better-sqlite3 is required to run prisma/seed-sqlite.ts. ' +
      'Install it before running this script.'
    )
  }
}

interface PathFrontmatter {
  id: string
  title: string
  description: string
  icon?: string
  estimatedHours?: number
  difficulty?: string
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
  duration?: string
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

interface FallbackLesson {
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

function buildFallbackLessons(course: ImportedCourseMeta): FallbackLesson[] {
  const firstId = deterministicUuid(`${course.id}:lesson:foundation`)
  const secondId = deterministicUuid(`${course.id}:lesson:concepts`)
  const thirdId = deterministicUuid(`${course.id}:lesson:practice`)

  const outcomes = course.learningOutcomes.length > 0
    ? course.learningOutcomes
    : [
        'Understand the core concepts covered in this course',
        'Apply your learning in practical scenarios',
        'Build momentum through repeatable practice',
      ]

  const prerequisites = course.prerequisites.length > 0
    ? course.prerequisites
    : ['No strict prerequisites - consistency matters most.']

  const lessonOneContent = `
# ${course.title}: Orientation

## Why This Course Matters
${course.description}

## Learning Outcomes
${outcomes.map(item => `- ${item}`).join('\n')}

## Prerequisites
${prerequisites.map(item => `- ${item}`).join('\n')}

## Weekly Study Plan
1. Review this orientation and set a schedule.
2. Complete the core concepts workshop.
3. Finish the practice sprint project and reflect.

## Knowledge Check
1. What is the best way to start this course?
   - Commit to a consistent schedule and complete lessons in sequence.
   - Skip to advanced topics and fill gaps later.
   - Wait for large free blocks before doing anything.
   - Read summaries only and avoid hands-on work.
`

  const lessonTwoContent = `
# Core Concepts Workshop

## Concept Flow
This lesson links foundational ideas from ${course.title} to practical execution.

## Execution Principles
- Learn one idea, then apply it immediately.
- Document assumptions, results, and improvements.
- Use feedback loops to close learning gaps quickly.

## Practice Activity
Draft a mini implementation plan with:
- Objective
- Tools
- Success criteria
- Timebox

## Knowledge Check
1. Which approach usually improves retention most?
   - Immediate practice after learning a concept.
   - Passive consumption of many lessons first.
   - Memorizing terms without application.
   - Delaying all implementation to the end.
`

  const lessonThreeContent = `
# Practice Sprint Project

## Sprint Goal
Build and ship a small artifact using what you learned in ${course.title}.

## Deliverables
- One working project artifact
- A concise reflection on wins and gaps
- A list of next improvements

## Suggested Workflow
1. Define a narrow scope.
2. Build a first version quickly.
3. Collect feedback.
4. Iterate once with clear improvements.

## Knowledge Check
1. What indicates this sprint succeeded?
   - You shipped a usable artifact and captured what you learned.
   - You consumed material but built nothing.
   - You postponed shipping until the work is perfect.
   - You skipped feedback to avoid rework.
`

  return [
    {
      id: firstId,
      title: `${course.title}: Orientation`,
      type: 'lesson',
      duration: '25 min',
      order: 1,
      sectionSlug: 'foundations',
      content: lessonOneContent.trim(),
      nextLessonId: secondId,
    },
    {
      id: secondId,
      title: 'Core Concepts Workshop',
      type: 'lesson',
      duration: '35 min',
      order: 2,
      sectionSlug: 'foundations',
      content: lessonTwoContent.trim(),
      prevLessonId: firstId,
      nextLessonId: thirdId,
    },
    {
      id: thirdId,
      title: 'Practice Sprint Project',
      type: 'project',
      duration: '45 min',
      order: 3,
      sectionSlug: 'applied-practice',
      content: lessonThreeContent.trim(),
      prevLessonId: secondId,
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
    questions.push({
      question,
      options,
      correctAnswer: 0,
      explanation: `The correct answer is: ${options[0]}`
    })
  }

  return questions
}

/**
 * Extract learning outcomes from markdown content
 */
function extractLearningOutcomes(content: string): string[] {
  const pattern = /## Learning Outcomes\s*([\s\S]*?)(?=\n## |$)/i
  const match = content.match(pattern)
  if (!match) return []

  const outcomes = match[1].match(/^-\s+(.+)$/gm)
  if (!outcomes) return []

  return outcomes.map(o => o.replace(/^-\s+/, '').trim())
}

/**
 * Extract prerequisites from markdown content
 */
function extractPrerequisites(content: string): string[] {
  const pattern = /## Prerequisites\s*([\s\S]*?)(?=\n## |$)/i
  const match = content.match(pattern)
  if (!match) return []

  const prereqs = match[1].match(/^-\s+(.+)$/gm)
  if (!prereqs) return []

  return prereqs.map(p => p.replace(/^-\s+/, '').trim())
}

async function seed() {
  console.log('🌱 Seeding database...\n')

  // Open database
  const Database = loadSqliteDriver()
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const now = new Date().toISOString()

  // Clear existing content data (preserve users if needed)
  // Must delete in correct order to respect foreign key constraints
  console.log('🗑️  Clearing existing content data...')

  // Temporarily disable foreign keys for cleanup, then re-enable
  db.pragma('foreign_keys = OFF')

  // Helper to check if table exists before deleting
  const tableExists = (name: string) => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name)
    return !!result
  }

  // Delete from tables that exist
  const tablesToClear = [
    'QuizScore',
    '_CompletedLessons',
    'VideoProgress',
    'DiscussionReply',
    'Discussion',
    'ProjectSubmission',
    'CourseProgress',
    'Certificate',
    'CourseRecommendation',
    'QuizQuestion',
    'Lesson',
    'CourseSection',
    'Course',
    'Path',
  ]

  for (const table of tablesToClear) {
    if (tableExists(table)) {
      db.exec(`DELETE FROM ${table};`)
    }
  }

  db.pragma('foreign_keys = ON')

  // Import Paths
  console.log('\n📚 Importing learning paths...')
  const pathsDir = path.join(CONTENT_DIR, 'paths')
  if (fs.existsSync(pathsDir)) {
    const pathFiles = fs.readdirSync(pathsDir).filter(f => f.endsWith('.md'))

    const insertPath = db.prepare(`
      INSERT OR REPLACE INTO Path (id, title, description, icon, estimatedHours, difficulty, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const file of pathFiles) {
      const filePath = path.join(pathsDir, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const parsed = matter(fileContent)
      const data = parsed.data as PathFrontmatter

      insertPath.run(
        data.id,
        data.title,
        data.description,
        data.icon || null,
        data.estimatedHours || null,
        data.difficulty || null,
        now,
        now
      )

      console.log(`  ✅ Imported path: ${data.title}`)
    }
  }

  // Import Courses
  console.log('\n📖 Importing courses...')
  const coursesDir = path.join(CONTENT_DIR, 'courses')
  const importedCourses: ImportedCourseMeta[] = []
  if (fs.existsSync(coursesDir)) {
    const courseFiles = fs.readdirSync(coursesDir).filter(f => f.endsWith('.md') && !fs.statSync(path.join(coursesDir, f)).isDirectory())

    const insertCourse = db.prepare(`
      INSERT OR REPLACE INTO Course (id, title, description, difficulty, durationHours, pathId, learningOutcomes, prerequisites, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const file of courseFiles) {
      const filePath = path.join(coursesDir, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const parsed = matter(fileContent)
      const data = parsed.data as CourseFrontmatter
      const content = parsed.content

      // Validate difficulty enum
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced']
      const difficulty = validDifficulties.includes(data.difficulty) ? data.difficulty : 'Beginner'

      // Extract learning outcomes and prerequisites from content
      const learningOutcomes = extractLearningOutcomes(content)
      const prerequisites = extractPrerequisites(content)

      insertCourse.run(
        data.id,
        data.title,
        data.description,
        difficulty,
        data.durationHours || 10,
        data.pathId,
        JSON.stringify(learningOutcomes),
        JSON.stringify(prerequisites),
        now,
        now
      )

      console.log(`  ✅ Imported course: ${data.title}`)

      importedCourses.push({
        id: data.id,
        title: data.title,
        description: data.description,
        learningOutcomes,
        prerequisites,
      })
    }
  }

  // Import Lessons
  console.log('\n📝 Importing lessons...')
  const sectionTracker = new Map<string, boolean>()

  const insertSection = db.prepare(`
    INSERT OR REPLACE INTO CourseSection (id, title, description, "order", courseId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertLesson = db.prepare(`
    INSERT OR REPLACE INTO Lesson (id, title, content, type, duration, hasProject, sectionId, nextLessonId, prevLessonId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertQuizQuestion = db.prepare(`
    INSERT OR REPLACE INTO QuizQuestion (id, question, options, correctAnswer, explanation, lessonId, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  if (fs.existsSync(coursesDir)) {
    // Find all course directories
    const courseDirectories = fs.readdirSync(coursesDir).filter(f => {
      const fullPath = path.join(coursesDir, f)
      return fs.statSync(fullPath).isDirectory()
    })

    for (const courseDir of courseDirectories) {
      const lessonsDir = path.join(coursesDir, courseDir, 'lessons')
      if (!fs.existsSync(lessonsDir)) continue

      const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.md'))

      // Sort lesson files by their order
      const lessons: { file: string; data: LessonFrontmatter; content: string }[] = []
      for (const lessonFile of lessonFiles) {
        const filePath = path.join(lessonsDir, lessonFile)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const parsed = matter(fileContent)
        lessons.push({
          file: lessonFile,
          data: parsed.data as LessonFrontmatter,
          content: parsed.content
        })
      }

      // Sort by order
      lessons.sort((a, b) => (a.data.order || 0) - (b.data.order || 0))

      for (const lesson of lessons) {
        const { data, content } = lesson
        const lessonId = (() => {
          const maybeId = (data.id || '').trim()
          if (!maybeId) return deterministicUuid(`${courseDir}:${lesson.file}`)
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(maybeId)
          return isUuid ? maybeId : deterministicUuid(`${courseDir}:${maybeId}`)
        })()

        // Validate lesson type
        const validTypes = ['lesson', 'project', 'quiz']
        const lessonType = validTypes.includes(data.type) ? data.type : 'lesson'

        // Create section if it doesn't exist
        const sectionId = `${courseDir}-${data.section}`
        if (!sectionTracker.has(sectionId)) {
          const sectionTitle = sectionTitleFromSlug(data.section)

          insertSection.run(
            sectionId,
            sectionTitle,
            `Learn about ${data.section.replace(/-/g, ' ')}`,
            data.order || 1,
            courseDir,
            now,
            now
          )
          sectionTracker.set(sectionId, true)
        }

        // Create lesson
        const hasProject = lessonType === 'project'
        insertLesson.run(
          lessonId,
          data.title,
          content,
          lessonType,
          data.duration || null,
          hasProject ? 1 : 0,
          sectionId,
          data.nextLessonId || null,
          data.prevLessonId || null,
          now,
          now
        )

        console.log(`  ✅ Imported lesson: ${data.title}`)

        // Parse and import quiz questions
        const quizQuestions = parseQuizQuestions(content)
        if (quizQuestions.length > 0) {
          console.log(`    📋 Found ${quizQuestions.length} quiz questions`)

          for (let i = 0; i < quizQuestions.length; i++) {
            const quiz = quizQuestions[i]
            const quizId = deterministicUuid(`${lessonId}:quiz:${i + 1}`)

            insertQuizQuestion.run(
              quizId,
              quiz.question,
              JSON.stringify(quiz.options),
              quiz.correctAnswer,
              quiz.explanation || '',
              lessonId,
              now,
              now
            )
          }
        }
      }
    }
  }

  const countLessonsForCourse = db.prepare(`
    SELECT COUNT(*) as count
    FROM Lesson l
    JOIN CourseSection cs ON l.sectionId = cs.id
    WHERE cs.courseId = ?
  `)

  // Generate starter lessons for courses without authored lesson markdown.
  for (const course of importedCourses) {
    const existingLessons = countLessonsForCourse.get(course.id) as { count: number }
    if (existingLessons.count > 0) {
      continue
    }

    const fallbackLessons = buildFallbackLessons(course)

    for (const fallback of fallbackLessons) {
      const sectionId = `${course.id}-${fallback.sectionSlug}`
      if (!sectionTracker.has(sectionId)) {
        const sectionOrder = fallback.sectionSlug === 'foundations' ? 1 : 2
        insertSection.run(
          sectionId,
          sectionTitleFromSlug(fallback.sectionSlug),
          `Auto-generated starter section for ${course.title}`,
          sectionOrder,
          course.id,
          now,
          now
        )
        sectionTracker.set(sectionId, true)
      }

      insertLesson.run(
        fallback.id,
        fallback.title,
        fallback.content,
        fallback.type,
        fallback.duration,
        fallback.type === 'project' ? 1 : 0,
        sectionId,
        fallback.nextLessonId || null,
        fallback.prevLessonId || null,
        now,
        now
      )

      const quizQuestions = parseQuizQuestions(fallback.content)
      for (let i = 0; i < quizQuestions.length; i++) {
        const quiz = quizQuestions[i]
        const quizId = deterministicUuid(`${fallback.id}:quiz:${i + 1}`)
        insertQuizQuestion.run(
          quizId,
          quiz.question,
          JSON.stringify(quiz.options),
          quiz.correctAnswer,
          quiz.explanation || '',
          fallback.id,
          now,
          now
        )
      }
    }

    console.log(`  ✅ Generated starter lessons for course: ${course.title}`)
  }

  // Create sample users
  console.log('\n👥 Creating test users...')
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = await hash(process.env.TEST_ADMIN_PASSWORD || 'Admin123!', 10)
  const userEmail = process.env.TEST_USER_EMAIL || 'user@example.com'
  const userPassword = await hash(process.env.TEST_USER_PASSWORD || 'User1234!', 10)
  const instructorEmail = 'instructor@example.com'
  const instructorPassword = await hash('Instructor1!', 10)

  // Check which columns exist in User table
  const userColumns = db.prepare('PRAGMA table_info(User)').all() as { name: string }[]
  const userColumnNames = userColumns.map(c => c.name)
  const hasStreakColumns = userColumnNames.includes('currentStreak')

  const insertUser = hasStreakColumns
    ? db.prepare(`
        INSERT OR REPLACE INTO User (id, email, name, password, role, emailVerified, points, showOnLeaderboard, currentStreak, longestStreak, streakFreezes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
    : db.prepare(`
        INSERT OR REPLACE INTO User (id, email, name, password, role, emailVerified, points, showOnLeaderboard, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

  // Check if users exist
  const existingAdmin = db.prepare('SELECT id FROM User WHERE email = ?').get(adminEmail) as { id: string } | undefined
  const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(userEmail) as { id: string } | undefined
  const existingInstructor = db.prepare('SELECT id FROM User WHERE email = ?').get(instructorEmail) as { id: string } | undefined

  const adminId = existingAdmin?.id || randomUUID()
  const userId = existingUser?.id || randomUUID()
  const instructorId = existingInstructor?.id || randomUUID()

  if (hasStreakColumns) {
    insertUser.run(adminId, adminEmail, 'Admin User', adminPassword, 'admin', 1, 0, 1, 0, 0, 0, now, now)
    insertUser.run(userId, userEmail, 'Regular User', userPassword, 'student', 1, 100, 1, 5, 10, 2, now, now)
    insertUser.run(instructorId, instructorEmail, 'Course Instructor', instructorPassword, 'instructor', 1, 500, 1, 15, 30, 3, now, now)
  } else {
    insertUser.run(adminId, adminEmail, 'Admin User', adminPassword, 'admin', 1, 0, 1, now, now)
    insertUser.run(userId, userEmail, 'Regular User', userPassword, 'student', 1, 100, 1, now, now)
    insertUser.run(instructorId, instructorEmail, 'Course Instructor', instructorPassword, 'instructor', 1, 500, 1, now, now)
  }

  console.log('  ✅ Created test users')

  // Create achievements
  console.log('\n🏆 Creating achievements...')
  const insertAchievement = db.prepare(`
    INSERT OR REPLACE INTO Achievement (id, name, description, icon, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const achievements = [
    { id: 'first-lesson', name: 'First Steps', description: 'Completed your first lesson', icon: 'book-open' },
    { id: 'first-course', name: 'Course Graduate', description: 'Completed your first course', icon: 'award' },
    { id: 'streak-7', name: 'Week Warrior', description: 'Maintained a 7-day learning streak', icon: 'flame' },
    { id: 'streak-30', name: 'Monthly Master', description: 'Maintained a 30-day learning streak', icon: 'fire' },
    { id: 'quiz-perfect', name: 'Perfect Score', description: 'Got 100% on a quiz', icon: 'trophy' },
    { id: 'helper', name: 'Community Helper', description: 'Helped someone in discussions', icon: 'hand-helping' },
    { id: 'project-approved', name: 'Project Pro', description: 'Had your first project approved', icon: 'check-circle' },
    { id: 'path-complete', name: 'Path Pioneer', description: 'Completed an entire learning path', icon: 'map' },
  ]

  for (const achievement of achievements) {
    insertAchievement.run(achievement.id, achievement.name, achievement.description, achievement.icon, now, now)
  }
  console.log('  ✅ Created achievements')

  // Create sample course progress for the regular user
  console.log('\n📈 Creating sample progress data...')

  // Get the first course and its lessons
  const firstCourse = db.prepare('SELECT id FROM Course LIMIT 1').get() as { id: string } | undefined
  if (firstCourse) {
    const progressId = randomUUID()
    const insertProgress = db.prepare(`
      INSERT OR REPLACE INTO CourseProgress (id, userId, courseId, lastAccessed, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insertProgress.run(progressId, userId, firstCourse.id, now, now, now)

    // Mark first few lessons as completed
    const firstLessons = db.prepare(`
      SELECT l.id FROM Lesson l
      JOIN CourseSection cs ON l.sectionId = cs.id
      WHERE cs.courseId = ?
      ORDER BY l.id
      LIMIT 3
    `).all(firstCourse.id) as { id: string }[]

    for (const lesson of firstLessons) {
      db.prepare(`
        INSERT OR IGNORE INTO _CompletedLessons (A, B)
        VALUES (?, ?)
      `).run(progressId, lesson.id)
    }

    console.log('  ✅ Created sample progress')
  }

  // Create sample discussions
  console.log('\n💬 Creating sample discussions...')
  const firstLesson = db.prepare('SELECT id FROM Lesson LIMIT 1').get() as { id: string } | undefined
  if (firstLesson) {
    const discussionId = randomUUID()
    const insertDiscussion = db.prepare(`
      INSERT OR REPLACE INTO Discussion (id, userId, content, lessonId, likes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertDiscussion.run(
      discussionId,
      userId,
      'I found this lesson really helpful! Can someone explain more about the concepts discussed here?',
      firstLesson.id,
      5,
      now,
      now
    )

    // Add a reply from admin
    const replyId = randomUUID()
    const insertReply = db.prepare(`
      INSERT OR REPLACE INTO DiscussionReply (id, userId, discussionId, content, likes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertReply.run(
      replyId,
      adminId,
      discussionId,
      'Great question! The key concepts covered in this lesson build the foundation for more advanced topics. Feel free to ask specific questions!',
      3,
      now,
      now
    )

    console.log('  ✅ Created sample discussions')
  }

  // Print summary
  const pathCount = db.prepare('SELECT COUNT(*) as count FROM Path').get() as { count: number }
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM Course').get() as { count: number }
  const sectionCount = db.prepare('SELECT COUNT(*) as count FROM CourseSection').get() as { count: number }
  const lessonCount = db.prepare('SELECT COUNT(*) as count FROM Lesson').get() as { count: number }
  const quizCount = db.prepare('SELECT COUNT(*) as count FROM QuizQuestion').get() as { count: number }
  const userCount = db.prepare('SELECT COUNT(*) as count FROM User').get() as { count: number }
  const achievementCount = db.prepare('SELECT COUNT(*) as count FROM Achievement').get() as { count: number }

  console.log('\n✨ Seeding completed successfully!')
  console.log('\n📊 Database Summary:')
  console.log(`  - Paths: ${pathCount.count}`)
  console.log(`  - Courses: ${courseCount.count}`)
  console.log(`  - Sections: ${sectionCount.count}`)
  console.log(`  - Lessons: ${lessonCount.count}`)
  console.log(`  - Quiz Questions: ${quizCount.count}`)
  console.log(`  - Users: ${userCount.count}`)
  console.log(`  - Achievements: ${achievementCount.count}`)

  console.log('\n🔐 Test Credentials:')
  console.log(`  Admin: ${adminEmail} / Admin123!`)
  console.log(`  User: ${userEmail} / User1234!`)
  console.log(`  Instructor: ${instructorEmail} / Instructor1!`)

  db.close()
}

seed().catch(console.error)
