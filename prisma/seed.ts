import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { importContent } from './content-importer'
import { seedAssessments } from './seed-assessments'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  // Import content from markdown files first
  console.log('📚 Importing content from markdown files...')
  await importContent()

  // Create users
  // WARNING: These credentials are for development/testing only
  // In production, use proper authentication flow
  console.log('\n👥 Creating test users...')
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = await hash(process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME_IN_ENV', 10)
  const userEmail = process.env.TEST_USER_EMAIL || 'user@example.com'
  const userPassword = await hash(process.env.TEST_USER_PASSWORD || 'CHANGE_ME_IN_ENV', 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: adminPassword,
      githubUsername: 'admin-github',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      name: 'Regular User',
      password: userPassword,
      githubUsername: 'user-github',
    },
  })

  console.log('  ✅ Created test users')
  console.log('\n⚠️  Test users created with credentials from .env file')

  // Additional sample data and achievements created below

  // Create achievements
  console.log('\n🏆 Creating achievements...')
  const firstLessonAchievement = await prisma.achievement.upsert({
    where: { id: 'first-lesson' },
    update: {},
    create: {
      id: 'first-lesson',
      name: 'First Steps',
      description: 'Completed your first lesson',
      icon: 'book-open',
    },
  })

  const firstCourseAchievement = await prisma.achievement.upsert({
    where: { id: 'first-course' },
    update: {},
    create: {
      id: 'first-course',
      name: 'Course Graduate',
      description: 'Completed your first course',
      icon: 'award',
    },
  })

  console.log('  ✅ Created achievements')

  // Create sample discussions (only if lessons exist)
  console.log('\n💬 Creating sample discussions...')
  const firstLesson = await prisma.lesson.findFirst()

  if (firstLesson) {
    const discussion1 = await prisma.discussion.upsert({
      where: { id: 'discussion-1' },
      update: {},
      create: {
        id: 'discussion-1',
        userId: user.id,
        content: 'I found this lesson really helpful! Can someone explain more about semantic HTML?',
        lessonId: firstLesson.id,
        likes: 5,
      },
    })

    await prisma.discussionReply.upsert({
      where: { id: 'reply-1' },
      update: {},
      create: {
        id: 'reply-1',
        userId: admin.id,
        discussionId: discussion1.id,
        content: 'Semantic HTML refers to using HTML elements that clearly describe their meaning to both the browser and the developer. Examples include <header>, <footer>, <article>, etc.',
        likes: 3,
      },
    })

    console.log('  ✅ Created sample discussions')
  }

  // Seed skill assessments
  await seedAssessments()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
