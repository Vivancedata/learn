/**
 * Database seeding script using better-sqlite3
 * This bypasses Prisma client generation issues by directly using SQLite
 */

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { hash } from 'bcryptjs'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
const CONTENT_DIR = path.join(process.cwd(), 'content')

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

        // Validate lesson type
        const validTypes = ['lesson', 'project', 'quiz']
        const lessonType = validTypes.includes(data.type) ? data.type : 'lesson'

        // Create section if it doesn't exist
        const sectionId = `${courseDir}-${data.section}`
        if (!sectionTracker.has(sectionId)) {
          // Format section title from slug
          const sectionTitle = data.section
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')

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
          data.id,
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
            const quizId = `${data.id}-quiz-${i + 1}`

            insertQuizQuestion.run(
              quizId,
              quiz.question,
              JSON.stringify(quiz.options),
              quiz.correctAnswer,
              quiz.explanation || '',
              data.id,
              now,
              now
            )
          }
        }
      }
    }
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
