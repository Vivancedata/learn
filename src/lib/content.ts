import prisma from '@/lib/db'
import { Course, Path, Lesson } from '@/types/course'
import { adaptCourses, adaptCourse, adaptPath, adaptPaths, adaptLessonWithQuiz } from '@/lib/type-adapters'

function rethrowContentError(operation: string, error: unknown): never {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Content] Failed to ${operation}:`, error)
  }

  throw new Error(`Failed to ${operation}`)
}

/**
 * Fetch all courses with their sections and lessons
 * @returns Array of courses with their complete structure
 */
export async function getAllCourses(): Promise<Course[]> {
  try {
    const courses = await prisma.course.findMany({
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
          include: {
            lessons: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        path: true,
      },
    })

    return adaptCourses(courses)
  } catch (error) {
    return rethrowContentError('load courses', error)
  }
}

/**
 * Fetch a specific course by ID with its sections and lessons
 * @param courseId - The unique identifier for the course
 * @returns The course data or null if not found
 */
export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
          include: {
            lessons: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        path: true,
      },
    })

    if (!course) return null

    return adaptCourse(course)
  } catch (error) {
    return rethrowContentError(`load course ${courseId}`, error)
  }
}

/**
 * Fetch a specific lesson by ID, validating it belongs to the specified course
 * @param courseId - The parent course ID (used for validation)
 * @param lessonId - The lesson ID to fetch
 * @returns The lesson data with quiz questions or null if not found/invalid
 */
export async function getLessonById(courseId: string, lessonId: string): Promise<Lesson | null> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        section: {
          include: {
            course: true,
          },
        },
        quizQuestions: true,
      },
    })

    if (!lesson || lesson.section.course.id !== courseId) {
      return null
    }

    return adaptLessonWithQuiz(lesson)
  } catch (error) {
    return rethrowContentError(`load lesson ${lessonId} for course ${courseId}`, error)
  }
}

/**
 * Parse knowledge check questions from lesson content.
 *
 * Expected markdown format in lesson .md files:
 *
 * ## Knowledge Check
 *
 * 1. Question text here?
 *    - First option (this is the correct answer — always listed first)
 *    - Second option
 *    - Third option
 *    - Fourth option
 *
 * 2. Another question?
 *    - Correct option
 *    - Wrong option A
 *    - Wrong option B
 *
 * Rules:
 * - The section begins with the heading `## Knowledge Check` (case-sensitive).
 * - Each question is a numbered list item (`1.`, `2.`, …).
 * - Options are indented bullet points (`- ` or `* `) directly below the question.
 * - The FIRST option listed is always the correct answer (correctAnswer index 0).
 * - No explicit explanation syntax is required; the field is omitted when absent.
 * - The section ends at the next `##`-level heading or at end of file.
 *
 * @param content - Raw markdown string of the lesson
 * @returns Object with a `questions` array, or `null` when no section is found
 */
export function parseKnowledgeCheck(content: string): { questions: import('@/types/knowledge-check').Question[] } | null {
  if (!content || typeof content !== 'string') {
    return null
  }

  // Locate the "## Knowledge Check" heading.
  const headingIndex = content.indexOf('## Knowledge Check')
  if (headingIndex === -1) {
    return null
  }

  // Take the content that starts right after the heading line.
  const afterHeading = content.slice(headingIndex + '## Knowledge Check'.length)

  // The section ends at the next markdown heading (one or more `#` at line start)
  // or at the end of the string.
  const nextHeadingMatch = afterHeading.match(/\n(?=#)/)
  const sectionText = nextHeadingMatch
    ? afterHeading.slice(0, nextHeadingMatch.index)
    : afterHeading

  if (!sectionText || sectionText.trim() === '') {
    return null
  }

  // Split the section into individual question blocks.
  // Each block starts with a numbered list marker (e.g. "1. ", "2. ").
  // The regex splits on lines that begin with one or more digits followed by ". ".
  const questionBlocks = sectionText
    .split(/(?=^\d+\.\s)/m)
    .map(block => block.trim())
    .filter(block => /^\d+\.\s/.test(block))

  if (questionBlocks.length === 0) {
    return null
  }

  const questions: import('@/types/knowledge-check').Question[] = []

  for (let blockIndex = 0; blockIndex < questionBlocks.length; blockIndex++) {
    const block = questionBlocks[blockIndex]
    const lines = block.split('\n').map(line => line.trim()).filter(line => line !== '')

    if (lines.length === 0) {
      continue
    }

    // First line: "N. Question text"
    const questionLineMatch = lines[0].match(/^\d+\.\s+(.+)$/)
    if (!questionLineMatch) {
      continue
    }

    const questionText = questionLineMatch[1].trim()

    // Remaining lines: option bullets starting with "- " or "* "
    const options: string[] = []
    for (let i = 1; i < lines.length; i++) {
      const optionMatch = lines[i].match(/^[-*]\s+(.+)$/)
      if (optionMatch) {
        options.push(optionMatch[1].trim())
      }
    }

    // Need at least one option to form a valid question
    if (options.length === 0) {
      continue
    }

    questions.push({
      question: questionText,
      options,
      // The first option listed in the markdown is always the correct answer
      correctAnswer: 0,
    })
  }

  if (questions.length === 0) {
    return null
  }

  return { questions }
}

/**
 * Fetch all learning paths with their courses
 * @returns Array of all learning paths with course IDs
 */
export async function getAllPaths(): Promise<Path[]> {
  try {
    const paths = await prisma.path.findMany({
      include: {
        courses: true,
      },
    })

    return adaptPaths(paths)
  } catch (error) {
    return rethrowContentError('load learning paths', error)
  }
}

/**
 * Fetch a specific learning path by ID with its courses
 * @param pathId - The unique identifier for the learning path
 * @returns The learning path data or null if not found
 */
export async function getPathById(pathId: string): Promise<Path | null> {
  try {
    const path = await prisma.path.findUnique({
      where: {
        id: pathId,
      },
      include: {
        courses: true,
      },
    })

    if (!path) return null

    return adaptPath(path)
  } catch (error) {
    return rethrowContentError(`load learning path ${pathId}`, error)
  }
}

/**
 * Calculate course progress statistics
 */
export function calculateCourseProgress(course: Course) {
  const totalLessons = course.sections.reduce(
    (total, section) => total + section.lessons.length,
    0
  )
  
  const totalProjects = course.sections.reduce(
    (total, section) => 
      total + section.lessons.filter(lesson => lesson.hasProject).length,
    0
  )
  
  return {
    totalLessons,
    totalProjects,
  }
}
