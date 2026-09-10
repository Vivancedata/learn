/**
 * Type adapters to safely convert Prisma types to domain types
 * This file bridges the gap between database models and application interfaces
 */

import type { Course as PrismaCourse, Path as PrismaPath, Lesson as PrismaLesson, CourseSection as PrismaCourseSection, VideoProgress as PrismaVideoProgress, SkillAssessment as PrismaSkillAssessment, AssessmentQuestion as PrismaAssessmentQuestion, AssessmentAttempt as PrismaAssessmentAttempt } from '@prisma/client'
import type { Course, Path, Lesson, CourseSection, VideoProvider, VideoChapter, VideoProgress, CourseCatalogEntry, CourseCatalogSection } from '@/types/course'
import type { SkillAssessment, AssessmentQuestion, AssessmentAttempt, QuestionType, CourseDifficulty } from '@/types/assessment'

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
    // Video content fields
    videoUrl: prismaLesson.videoUrl ?? undefined,
    videoDuration: prismaLesson.videoDuration ?? undefined,
    videoProvider: prismaLesson.videoProvider as VideoProvider | undefined,
    videoTranscript: prismaLesson.videoTranscript ?? undefined,
    videoChapters: prismaLesson.videoChapters
      ? safeJsonParse<VideoChapter[]>(prismaLesson.videoChapters, [])
      : undefined,
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
 * Shape returned by the catalog `select` in GET /api/courses. Lesson bodies,
 * transcripts and video metadata are never selected, so they cannot leak into
 * the list response by accident.
 */
export type PrismaCourseCatalogRow = {
  id: string
  title: string
  description: string
  difficulty: PrismaCourse['difficulty']
  durationHours: number
  pathId: string
  prerequisites: string | null
  learningOutcomes: string | null
  sections: Array<{
    id: string
    title: string
    description: string | null
    order: number
    lessons: Array<{
      id: string
      title: string
      type: PrismaLesson['type']
      duration: string | null
    }>
  }>
}

/**
 * Convert a catalog projection row to the domain catalog entry the course
 * cards and dashboard consume.
 */
export function adaptCourseCatalogEntry(row: PrismaCourseCatalogRow): CourseCatalogEntry {
  const sections: CourseCatalogSection[] = row.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description ?? undefined,
    order: section.order,
    lessons: section.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      duration: lesson.duration ?? undefined,
    })),
  }))

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    durationHours: row.durationHours,
    pathId: row.pathId,
    prerequisites: row.prerequisites
      ? safeJsonParse<string[]>(row.prerequisites, [])
      : undefined,
    learningOutcomes: row.learningOutcomes
      ? safeJsonParse<string[]>(row.learningOutcomes, [])
      : undefined,
    sectionCount: sections.length,
    lessonCount: sections.reduce((total, section) => total + section.lessons.length, 0),
    sections,
  }
}

export function adaptCourseCatalog(rows: PrismaCourseCatalogRow[]): CourseCatalogEntry[] {
  return rows.map(adaptCourseCatalogEntry)
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

/**
 * Convert Prisma VideoProgress to domain VideoProgress type
 */
export function adaptVideoProgress(prismaProgress: PrismaVideoProgress): VideoProgress {
  return {
    lessonId: prismaProgress.lessonId,
    userId: prismaProgress.userId,
    watchedSeconds: prismaProgress.watchedSeconds,
    totalSeconds: prismaProgress.totalSeconds,
    completed: prismaProgress.completed,
    lastWatched: prismaProgress.lastWatched.toISOString(),
  }
}

// ============================================================================
// Skill Assessment Adapters
// ============================================================================

type PrismaSkillAssessmentWithQuestions = PrismaSkillAssessment & {
  questions?: PrismaAssessmentQuestion[]
}

type PrismaAssessmentAttemptWithAssessment = PrismaAssessmentAttempt & {
  assessment?: PrismaSkillAssessment
}

/**
 * Convert Prisma SkillAssessment to domain SkillAssessment type
 */
export function adaptSkillAssessment(prismaAssessment: PrismaSkillAssessmentWithQuestions): SkillAssessment {
  return {
    id: prismaAssessment.id,
    name: prismaAssessment.name,
    slug: prismaAssessment.slug,
    description: prismaAssessment.description,
    courseId: prismaAssessment.courseId ?? undefined,
    difficulty: prismaAssessment.difficulty as CourseDifficulty,
    timeLimit: prismaAssessment.timeLimit,
    passingScore: prismaAssessment.passingScore,
    totalQuestions: prismaAssessment.totalQuestions,
    skillArea: prismaAssessment.skillArea,
    questions: prismaAssessment.questions
      ? prismaAssessment.questions.map(adaptAssessmentQuestion)
      : undefined,
  }
}

/**
 * Convert Prisma AssessmentQuestion to domain AssessmentQuestion type
 */
export function adaptAssessmentQuestion(prismaQuestion: PrismaAssessmentQuestion): AssessmentQuestion {
  return {
    id: prismaQuestion.id,
    question: prismaQuestion.question,
    questionType: prismaQuestion.questionType as QuestionType,
    options: safeJsonParse<string[]>(prismaQuestion.options, []),
    correctAnswer: safeJsonParse<string | string[] | number>(prismaQuestion.correctAnswer, 0),
    explanation: prismaQuestion.explanation,
    difficulty: prismaQuestion.difficulty,
    points: prismaQuestion.points,
    codeSnippet: prismaQuestion.codeSnippet ?? undefined,
  }
}

/**
 * Convert Prisma AssessmentAttempt to domain AssessmentAttempt type
 */
export function adaptAssessmentAttempt(prismaAttempt: PrismaAssessmentAttemptWithAssessment): AssessmentAttempt {
  return {
    id: prismaAttempt.id,
    userId: prismaAttempt.userId,
    assessmentId: prismaAttempt.assessmentId,
    score: prismaAttempt.score,
    correctCount: prismaAttempt.correctCount,
    totalCount: prismaAttempt.totalCount,
    timeSpent: prismaAttempt.timeSpent,
    answers: safeJsonParse<Record<string, string | string[] | number>>(prismaAttempt.answers, {}),
    passed: prismaAttempt.passed,
    completedAt: prismaAttempt.completedAt.toISOString(),
    assessment: prismaAttempt.assessment
      ? adaptSkillAssessment(prismaAttempt.assessment)
      : undefined,
  }
}

/**
 * Convert array of Prisma SkillAssessments to domain SkillAssessment array
 */
export function adaptSkillAssessments(prismaAssessments: PrismaSkillAssessmentWithQuestions[]): SkillAssessment[] {
  return prismaAssessments.map(adaptSkillAssessment)
}

/**
 * Convert array of Prisma AssessmentAttempts to domain AssessmentAttempt array
 */
export function adaptAssessmentAttempts(prismaAttempts: PrismaAssessmentAttemptWithAssessment[]): AssessmentAttempt[] {
  return prismaAttempts.map(adaptAssessmentAttempt)
}

// Export safeJsonParse for use in other modules
export { safeJsonParse }
