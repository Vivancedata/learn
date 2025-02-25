import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create users
  const adminPassword = await hash('admin123', 10)
  const userPassword = await hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      githubUsername: 'admin-github',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: userPassword,
      githubUsername: 'user-github',
    },
  })

  console.log({ admin, user })

  // Create paths
  const webPath = await prisma.path.upsert({
    where: { id: 'web-development' },
    update: {},
    create: {
      id: 'web-development',
      title: 'Web Development',
      description: 'Learn to build modern web applications',
      icon: 'globe',
      estimatedHours: 120,
      difficulty: 'Beginner to Intermediate',
    },
  })

  const jsPath = await prisma.path.upsert({
    where: { id: 'javascript' },
    update: {},
    create: {
      id: 'javascript',
      title: 'JavaScript',
      description: 'Master JavaScript programming',
      icon: 'file',
      estimatedHours: 80,
      difficulty: 'Beginner to Advanced',
    },
  })

  const reactPath = await prisma.path.upsert({
    where: { id: 'react' },
    update: {},
    create: {
      id: 'react',
      title: 'React',
      description: 'Build modern UIs with React',
      icon: 'window',
      estimatedHours: 60,
      difficulty: 'Intermediate',
    },
  })

  console.log({ webPath, jsPath, reactPath })

  // Create courses
  const htmlCourse = await prisma.course.upsert({
    where: { id: 'html-css-basics' },
    update: {},
    create: {
      id: 'html-css-basics',
      title: 'HTML & CSS Basics',
      description: 'Learn the fundamentals of HTML and CSS',
      difficulty: 'Beginner',
      durationHours: 20,
      pathId: webPath.id,
      prerequisites: 'None',
      learningOutcomes: 'Build static websites with HTML and CSS',
    },
  })

  const jsCourse = await prisma.course.upsert({
    where: { id: 'javascript-fundamentals' },
    update: {},
    create: {
      id: 'javascript-fundamentals',
      title: 'JavaScript Fundamentals',
      description: 'Learn the core concepts of JavaScript',
      difficulty: 'Beginner',
      durationHours: 30,
      pathId: jsPath.id,
      prerequisites: 'Basic HTML and CSS knowledge',
      learningOutcomes: 'Write JavaScript code to add interactivity to websites',
    },
  })

  const reactCourse = await prisma.course.upsert({
    where: { id: 'react-basics' },
    update: {},
    create: {
      id: 'react-basics',
      title: 'React Basics',
      description: 'Learn the fundamentals of React',
      difficulty: 'Intermediate',
      durationHours: 25,
      pathId: reactPath.id,
      prerequisites: 'JavaScript fundamentals',
      learningOutcomes: 'Build interactive UIs with React',
    },
  })

  console.log({ htmlCourse, jsCourse, reactCourse })

  // Create course sections
  const htmlSection1 = await prisma.courseSection.upsert({
    where: { id: 'html-section-1' },
    update: {},
    create: {
      id: 'html-section-1',
      title: 'HTML Basics',
      description: 'Learn the fundamentals of HTML',
      order: 1,
      courseId: htmlCourse.id,
    },
  })

  const htmlSection2 = await prisma.courseSection.upsert({
    where: { id: 'html-section-2' },
    update: {},
    create: {
      id: 'html-section-2',
      title: 'CSS Basics',
      description: 'Learn the fundamentals of CSS',
      order: 2,
      courseId: htmlCourse.id,
    },
  })

  const jsSection1 = await prisma.courseSection.upsert({
    where: { id: 'js-section-1' },
    update: {},
    create: {
      id: 'js-section-1',
      title: 'JavaScript Syntax',
      description: 'Learn the basic syntax of JavaScript',
      order: 1,
      courseId: jsCourse.id,
    },
  })

  console.log({ htmlSection1, htmlSection2, jsSection1 })

  // Create lessons
  const htmlLesson1 = await prisma.lesson.upsert({
    where: { id: 'html-lesson-1' },
    update: {},
    create: {
      id: 'html-lesson-1',
      title: 'Introduction to HTML',
      content: '# Introduction to HTML\n\nHTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.',
      type: 'lesson',
      duration: '30 minutes',
      sectionId: htmlSection1.id,
    },
  })

  const htmlLesson2 = await prisma.lesson.upsert({
    where: { id: 'html-lesson-2' },
    update: {},
    create: {
      id: 'html-lesson-2',
      title: 'HTML Elements',
      content: '# HTML Elements\n\nHTML elements are the building blocks of HTML pages.',
      type: 'lesson',
      duration: '45 minutes',
      sectionId: htmlSection1.id,
    },
  })

  const cssLesson1 = await prisma.lesson.upsert({
    where: { id: 'css-lesson-1' },
    update: {},
    create: {
      id: 'css-lesson-1',
      title: 'Introduction to CSS',
      content: '# Introduction to CSS\n\nCSS (Cascading Style Sheets) is used to style and layout web pages.',
      type: 'lesson',
      duration: '30 minutes',
      sectionId: htmlSection2.id,
    },
  })

  console.log({ htmlLesson1, htmlLesson2, cssLesson1 })

  // Create quiz questions
  const htmlQuiz1 = await prisma.quizQuestion.upsert({
    where: { id: 'html-quiz-1' },
    update: {},
    create: {
      id: 'html-quiz-1',
      question: 'What does HTML stand for?',
      options: JSON.stringify([
        'Hyper Text Markup Language',
        'High Tech Modern Language',
        'Hyper Transfer Markup Language',
        'Home Tool Markup Language',
      ]),
      correctAnswer: 0,
      explanation: 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
      lessonId: htmlLesson1.id,
    },
  })

  const htmlQuiz2 = await prisma.quizQuestion.upsert({
    where: { id: 'html-quiz-2' },
    update: {},
    create: {
      id: 'html-quiz-2',
      question: 'Which tag is used to define an HTML document?',
      options: JSON.stringify(['<body>', '<html>', '<head>', '<document>']),
      correctAnswer: 1,
      explanation: 'The <html> tag is used to define an HTML document.',
      lessonId: htmlLesson1.id,
    },
  })

  console.log({ htmlQuiz1, htmlQuiz2 })

  // Create achievements
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

  console.log({ firstLessonAchievement, firstCourseAchievement })

  // Create discussions
  const discussion1 = await prisma.discussion.upsert({
    where: { id: 'discussion-1' },
    update: {},
    create: {
      id: 'discussion-1',
      userId: user.id,
      content: 'I found this lesson really helpful! Can someone explain more about semantic HTML?',
      lessonId: htmlLesson1.id,
      likes: 5,
    },
  })

  const reply1 = await prisma.discussionReply.upsert({
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

  console.log({ discussion1, reply1 })

  // Create course progress
  const userProgress = await prisma.courseProgress.upsert({
    where: { id: 'user-html-progress' },
    update: {},
    create: {
      id: 'user-html-progress',
      userId: user.id,
      courseId: htmlCourse.id,
      lastAccessed: new Date(),
      completedLessons: {
        connect: [{ id: htmlLesson1.id }],
      },
    },
  })

  console.log({ userProgress })
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
