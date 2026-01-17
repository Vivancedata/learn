import prisma from '@/lib/db'
import { Course, Path, Lesson } from '@/types/course'
import { adaptCourses, adaptCourse, adaptPath, adaptPaths, adaptLessonWithQuiz } from '@/lib/type-adapters'

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
            lessons: true,
          },
        },
        path: true,
      },
    })

    return adaptCourses(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
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
            lessons: true,
          },
        },
        path: true,
      },
    })

    if (!course) return null

    return adaptCourse(course)
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error)
    return null
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
    console.error(`Error fetching lesson ${lessonId}:`, error)
    return null
  }
}

/**
 * Parse knowledge check questions from lesson content
 */
export function parseKnowledgeCheck(content: string) {
  // This is a placeholder implementation
  // In a real app, you would parse the markdown content to extract knowledge check questions
  const knowledgeCheckSection = content.match(/## Knowledge Check([\s\S]*?)(?=^##|\Z)/m)
  
  if (!knowledgeCheckSection) {
    return null
  }
  
  // Simple parsing logic - in a real app this would be more sophisticated
  return {
    questions: [
      {
        id: '1',
        question: 'What is HTML?',
        options: [
          'Hypertext Markup Language',
          'High-Tech Modern Language',
          'Hyper Tool Markup Language',
          'Home Text Management Language',
        ],
        correctAnswer: 0,
        explanation: 'HTML stands for Hypertext Markup Language, which is the standard markup language for creating web pages.',
      },
    ],
  }
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
    console.error('Error fetching paths:', error)
    return []
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
    console.error(`Error fetching path ${pathId}:`, error)
    return null
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
