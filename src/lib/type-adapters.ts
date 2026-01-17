/**
 * Type adapters to safely convert Prisma types to domain types
 * This file bridges the gap between database models and application interfaces
 */

import type { Course as PrismaCourse, Path as PrismaPath, Lesson as PrismaLesson, CourseSection as PrismaCourseSection } from '@prisma/client'
import type { Course, Path, Lesson, CourseSection } from '@/types/course'

type PrismaCourseWithRelations = PrismaCourse & {
  sections: (PrismaCourseSection & {
    lessons: PrismaLesson[]
  })[]
  path: PrismaPath
}

type PrismaPathWithRelations = PrismaPath & {
  courses: PrismaCourse[]
}

type PrismaLessonWithRelations = PrismaLesson & {
  section: PrismaCourseSection & {
    course: PrismaCourse
  }
  quizQuestions?: Array<{
    id: string
    question: string
    options: string
    correctAnswer: number
    explanation: string | null
  }>
}

/**
 * Safely parse JSON string field, returning default value on error
 */
function safeJsonParse<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}

/**
 * Convert Prisma Course to domain Course type
 */
export function adaptCourse(prismaCourse: PrismaCourseWithRelations): Course {
  return {
    id: prismaCourse.id,
    title: prismaCourse.title,
    description: prismaCourse.description,
    difficulty: prismaCourse.difficulty, // Now properly typed as enum
    durationHours: prismaCourse.durationHours,
    pathId: prismaCourse.pathId,
    sections: prismaCourse.sections.map(adaptCourseSection),
    prerequisites: prismaCourse.prerequisites
      ? safeJsonParse<string[]>(prismaCourse.prerequisites, [])
      : undefined,
    learningOutcomes: prismaCourse.learningOutcomes
      ? safeJsonParse<string[]>(prismaCourse.learningOutcomes, [])
      : undefined,
  }
}

/**
 * Convert Prisma CourseSection to domain CourseSection type
 */
export function adaptCourseSection(prismaSection: PrismaCourseSection & { lessons: PrismaLesson[] }): CourseSection {
  return {
    id: prismaSection.id,
    title: prismaSection.title,
    description: prismaSection.description ?? undefined,
    lessons: prismaSection.lessons.map(adaptLesson),
    order: prismaSection.order,
  }
}

/**
 * Convert Prisma Lesson to domain Lesson type
 */
export function adaptLesson(prismaLesson: PrismaLesson): Lesson {
  return {
    id: prismaLesson.id,
    title: prismaLesson.title,
    content: prismaLesson.content,
    type: prismaLesson.type, // Now properly typed as enum
    duration: prismaLesson.duration ?? undefined,
    hasProject: prismaLesson.hasProject,
    githubUrl: prismaLesson.githubUrl ?? undefined,
    nextLessonId: prismaLesson.nextLessonId ?? undefined,
    prevLessonId: prismaLesson.prevLessonId ?? undefined,
  }
}

/**
 * Convert Prisma Lesson with quiz questions to domain Lesson type with knowledge check
 */
export function adaptLessonWithQuiz(prismaLesson: PrismaLessonWithRelations): Lesson {
  const baseLesson = adaptLesson(prismaLesson)

  if (prismaLesson.quizQuestions && prismaLesson.quizQuestions.length > 0) {
    baseLesson.knowledgeCheck = {
      questions: prismaLesson.quizQuestions.map(q => ({
        question: q.question,
        options: safeJsonParse<string[]>(q.options, []),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      })),
    }
  }

  return baseLesson
}

/**
 * Convert Prisma Path to domain Path type
 */
export function adaptPath(prismaPath: PrismaPathWithRelations): Path {
  return {
    id: prismaPath.id,
    title: prismaPath.title,
    description: prismaPath.description,
    icon: prismaPath.icon ?? undefined,
    courses: prismaPath.courses.map(c => c.id),
    prerequisites: prismaPath.prerequisites
      ? safeJsonParse<string[]>(prismaPath.prerequisites, [])
      : undefined,
    estimatedHours: prismaPath.estimatedHours ?? undefined,
    difficulty: prismaPath.difficulty ?? undefined,
  }
}

/**
 * Convert array of Prisma Courses to domain Course array
 */
export function adaptCourses(prismaCourses: PrismaCourseWithRelations[]): Course[] {
  return prismaCourses.map(adaptCourse)
}

/**
 * Convert array of Prisma Paths to domain Path array
 */
export function adaptPaths(prismaPaths: PrismaPathWithRelations[]): Path[] {
  return prismaPaths.map(adaptPath)
}
