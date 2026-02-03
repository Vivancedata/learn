/**
 * AI-powered course recommendation engine
 * Generates personalized course recommendations based on user learning history
 */

import prisma from '@/lib/db'
import type { RecommendationType } from '@prisma/client'

// ============================================================================
// Types
// ============================================================================

export interface Recommendation {
  id: string
  courseId: string
  courseTitle: string
  courseDescription: string
  courseDifficulty: string
  courseDurationHours: number
  pathId: string
  pathTitle: string
  score: number
  reason: string
  reasonType: RecommendationType
  createdAt: Date
  expiresAt: Date
}

interface ScoringContext {
  userId: string
  completedCourseIds: Set<string>
  activePaths: Array<{
    pathId: string
    pathTitle: string
    courseIds: string[]
    completedCourseIds: string[]
  }>
  quizScores: Map<string, { score: number; maxScore: number }>
  recentlyCompletedCourses: Array<{
    courseId: string
    courseTitle: string
    pathId: string
  }>
  allCourses: Array<{
    id: string
    title: string
    description: string
    difficulty: string
    durationHours: number
    pathId: string
    pathTitle: string
    prerequisites: string[]
    totalLessons: number
    enrollmentCount: number
  }>
}

interface CourseScore {
  courseId: string
  score: number
  reason: string
  reasonType: RecommendationType
}

// ============================================================================
// Constants
// ============================================================================

const WEIGHTS = {
  LEARNING_PATH_PROGRESS: 0.35,
  TOPIC_SIMILARITY: 0.25,
  SKILL_GAP: 0.20,
  PREREQUISITES: 0.10,
  POPULARITY: 0.10,
}

const RECOMMENDATION_EXPIRY_HOURS = 24
const MAX_RECOMMENDATIONS = 10

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Generate personalized course recommendations for a user
 * Considers learning path progress, topic similarity, skill gaps, and popularity
 */
export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  // 1. Build scoring context with user's learning data
  const context = await buildScoringContext(userId)

  // 2. Score each uncompleted course
  const courseScores: CourseScore[] = []

  for (const course of context.allCourses) {
    // Skip already completed courses
    if (context.completedCourseIds.has(course.id)) {
      continue
    }

    const score = calculateCourseScore(course, context)
    if (score.score > 0) {
      courseScores.push(score)
    }
  }

  // 3. Sort by score and take top recommendations
  courseScores.sort((a, b) => b.score - a.score)
  const topScores = courseScores.slice(0, MAX_RECOMMENDATIONS)

  // 4. Store recommendations in database
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + RECOMMENDATION_EXPIRY_HOURS)

  // Delete old recommendations for this user
  await prisma.courseRecommendation.deleteMany({
    where: { userId },
  })

  // Insert new recommendations
  const recommendations: Recommendation[] = []

  for (const scoreData of topScores) {
    const course = context.allCourses.find(c => c.id === scoreData.courseId)
    if (!course) continue

    const recommendation = await prisma.courseRecommendation.create({
      data: {
        userId,
        courseId: scoreData.courseId,
        score: scoreData.score,
        reason: scoreData.reason,
        reasonType: scoreData.reasonType,
        expiresAt,
      },
      include: {
        course: {
          include: {
            path: true,
          },
        },
      },
    })

    recommendations.push({
      id: recommendation.id,
      courseId: recommendation.courseId,
      courseTitle: recommendation.course.title,
      courseDescription: recommendation.course.description,
      courseDifficulty: recommendation.course.difficulty,
      courseDurationHours: recommendation.course.durationHours,
      pathId: recommendation.course.pathId,
      pathTitle: recommendation.course.path.title,
      score: recommendation.score,
      reason: recommendation.reason,
      reasonType: recommendation.reasonType,
      createdAt: recommendation.createdAt,
      expiresAt: recommendation.expiresAt,
    })
  }

  return recommendations
}

/**
 * Get cached recommendations for a user
 * Returns existing recommendations if not expired, otherwise generates new ones
 */
export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  // Check for existing non-expired, non-dismissed recommendations
  const existingRecommendations = await prisma.courseRecommendation.findMany({
    where: {
      userId,
      dismissed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      course: {
        include: {
          path: true,
        },
      },
    },
    orderBy: {
      score: 'desc',
    },
  })

  // If we have recommendations, return them
  if (existingRecommendations.length > 0) {
    return existingRecommendations.map(rec => ({
      id: rec.id,
      courseId: rec.courseId,
      courseTitle: rec.course.title,
      courseDescription: rec.course.description,
      courseDifficulty: rec.course.difficulty,
      courseDurationHours: rec.course.durationHours,
      pathId: rec.course.pathId,
      pathTitle: rec.course.path.title,
      score: rec.score,
      reason: rec.reason,
      reasonType: rec.reasonType,
      createdAt: rec.createdAt,
      expiresAt: rec.expiresAt,
    }))
  }

  // Otherwise generate new recommendations
  return generateRecommendations(userId)
}

/**
 * Dismiss a recommendation
 */
export async function dismissRecommendation(
  userId: string,
  courseId: string
): Promise<void> {
  await prisma.courseRecommendation.updateMany({
    where: {
      userId,
      courseId,
    },
    data: {
      dismissed: true,
    },
  })
}

/**
 * Track when a user clicks on a recommendation
 */
export async function trackRecommendationClick(
  userId: string,
  courseId: string
): Promise<void> {
  await prisma.courseRecommendation.updateMany({
    where: {
      userId,
      courseId,
    },
    data: {
      clicked: true,
    },
  })
}

/**
 * Track when a user enrolls from a recommendation
 */
export async function trackRecommendationEnrollment(
  userId: string,
  courseId: string
): Promise<void> {
  await prisma.courseRecommendation.updateMany({
    where: {
      userId,
      courseId,
    },
    data: {
      enrolled: true,
    },
  })
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Build context needed for scoring recommendations
 */
async function buildScoringContext(userId: string): Promise<ScoringContext> {
  // Get user's course progress
  const courseProgress = await prisma.courseProgress.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          path: true,
          sections: {
            include: {
              lessons: true,
            },
          },
        },
      },
      completedLessons: true,
      quizScores: true,
    },
    orderBy: {
      lastAccessed: 'desc',
    },
  })

  // Get user's path progress
  const pathProgress = await prisma.pathProgress.findMany({
    where: { userId },
    include: {
      path: {
        include: {
          courses: true,
        },
      },
    },
  })

  // Get all courses with enrollment counts
  const allCoursesData = await prisma.course.findMany({
    include: {
      path: true,
      sections: {
        include: {
          lessons: true,
        },
      },
      progress: true,
    },
  })

  // Build completed course IDs set
  const completedCourseIds = new Set<string>()
  const recentlyCompletedCourses: ScoringContext['recentlyCompletedCourses'] = []

  for (const progress of courseProgress) {
    const totalLessons = progress.course.sections.reduce(
      (sum, section) => sum + section.lessons.length,
      0
    )
    const completedLessons = progress.completedLessons.length

    if (completedLessons >= totalLessons && totalLessons > 0) {
      completedCourseIds.add(progress.courseId)
      recentlyCompletedCourses.push({
        courseId: progress.courseId,
        courseTitle: progress.course.title,
        pathId: progress.course.pathId,
      })
    }
  }

  // Build quiz scores map (for skill gap analysis)
  const quizScores = new Map<string, { score: number; maxScore: number }>()
  for (const progress of courseProgress) {
    for (const quiz of progress.quizScores) {
      quizScores.set(quiz.lessonId, {
        score: quiz.score,
        maxScore: quiz.maxScore,
      })
    }
  }

  // Build active paths with progress
  const activePaths: ScoringContext['activePaths'] = pathProgress.map(pp => {
    const pathCourseIds = pp.path.courses.map(c => c.id)
    const completedInPath = pathCourseIds.filter(id => completedCourseIds.has(id))

    return {
      pathId: pp.pathId,
      pathTitle: pp.path.title,
      courseIds: pathCourseIds,
      completedCourseIds: completedInPath,
    }
  })

  // Build all courses array
  const allCourses: ScoringContext['allCourses'] = allCoursesData.map(course => {
    const totalLessons = course.sections.reduce(
      (sum, section) => sum + section.lessons.length,
      0
    )

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      durationHours: course.durationHours,
      pathId: course.pathId,
      pathTitle: course.path.title,
      prerequisites: course.prerequisites ? safeJsonParse<string[]>(course.prerequisites, []) : [],
      totalLessons,
      enrollmentCount: course.progress.length,
    }
  })

  return {
    userId,
    completedCourseIds,
    activePaths,
    quizScores,
    recentlyCompletedCourses: recentlyCompletedCourses.slice(0, 5), // Last 5 completed
    allCourses,
  }
}

/**
 * Calculate composite score for a course
 */
function calculateCourseScore(
  course: ScoringContext['allCourses'][0],
  context: ScoringContext
): CourseScore {
  const scores: Array<{ score: number; reason: string; reasonType: RecommendationType }> = []

  // 1. Learning Path Progress Score
  const pathScore = calculatePathProgressScore(course, context)
  if (pathScore) {
    scores.push(pathScore)
  }

  // 2. Topic Similarity Score
  const similarityScore = calculateTopicSimilarityScore(course, context)
  if (similarityScore) {
    scores.push(similarityScore)
  }

  // 3. Skill Gap Score
  const skillGapScore = calculateSkillGapScore(course, context)
  if (skillGapScore) {
    scores.push(skillGapScore)
  }

  // 4. Prerequisites Met Score
  const prerequisiteScore = calculatePrerequisiteScore(course, context)
  if (prerequisiteScore) {
    scores.push(prerequisiteScore)
  }

  // 5. Popularity Score
  const popularityScore = calculatePopularityScore(course, context)
  if (popularityScore) {
    scores.push(popularityScore)
  }

  // Find highest scoring reason
  if (scores.length === 0) {
    return {
      courseId: course.id,
      score: 0,
      reason: '',
      reasonType: 'POPULAR',
    }
  }

  // Calculate weighted total and find primary reason
  let totalScore = 0
  let primaryReason = scores[0]

  for (const s of scores) {
    totalScore += s.score
    if (s.score > primaryReason.score) {
      primaryReason = s
    }
  }

  return {
    courseId: course.id,
    score: Math.min(totalScore, 1), // Cap at 1.0
    reason: primaryReason.reason,
    reasonType: primaryReason.reasonType,
  }
}

/**
 * Score based on learning path progress
 */
function calculatePathProgressScore(
  course: ScoringContext['allCourses'][0],
  context: ScoringContext
): { score: number; reason: string; reasonType: RecommendationType } | null {
  // Find if this course is in any of the user's active paths
  const activePath = context.activePaths.find(
    path => path.courseIds.includes(course.id)
  )

  if (!activePath) return null

  // Find the position of this course in the path
  const courseIndex = activePath.courseIds.indexOf(course.id)
  const completedInPath = activePath.completedCourseIds.length

  // Is this the next course in the path?
  if (courseIndex === completedInPath) {
    return {
      score: WEIGHTS.LEARNING_PATH_PROGRESS,
      reason: `Continue your ${activePath.pathTitle} journey`,
      reasonType: 'CONTINUE_PATH',
    }
  }

  // Is it coming up soon in the path?
  if (courseIndex > completedInPath && courseIndex <= completedInPath + 2) {
    const distanceScore = WEIGHTS.LEARNING_PATH_PROGRESS * (1 - (courseIndex - completedInPath) * 0.3)
    return {
      score: Math.max(distanceScore, 0.1),
      reason: `Part of your ${activePath.pathTitle} path`,
      reasonType: 'CONTINUE_PATH',
    }
  }

  return null
}

/**
 * Score based on similarity to completed courses
 */
function calculateTopicSimilarityScore(
  course: ScoringContext['allCourses'][0],
  context: ScoringContext
): { score: number; reason: string; reasonType: RecommendationType } | null {
  if (context.recentlyCompletedCourses.length === 0) return null

  // Check if course is in the same path as recently completed courses
  const recentPathIds = new Set(context.recentlyCompletedCourses.map(c => c.pathId))

  if (recentPathIds.has(course.pathId)) {
    const recentCourse = context.recentlyCompletedCourses.find(
      c => c.pathId === course.pathId
    )

    if (recentCourse) {
      return {
        score: WEIGHTS.TOPIC_SIMILARITY,
        reason: `Because you completed ${recentCourse.courseTitle}`,
        reasonType: 'SIMILAR_TOPIC',
      }
    }
  }

  // Check for difficulty progression
  const completedDifficulties = new Set<string>()
  for (const completed of context.recentlyCompletedCourses) {
    const completedCourse = context.allCourses.find(c => c.id === completed.courseId)
    if (completedCourse) {
      completedDifficulties.add(completedCourse.difficulty)
    }
  }

  // Recommend intermediate if completed beginner
  if (completedDifficulties.has('Beginner') && course.difficulty === 'Intermediate') {
    return {
      score: WEIGHTS.TOPIC_SIMILARITY * 0.7,
      reason: 'Ready to level up from beginner courses',
      reasonType: 'COMPLEMENT',
    }
  }

  // Recommend advanced if completed intermediate
  if (completedDifficulties.has('Intermediate') && course.difficulty === 'Advanced') {
    return {
      score: WEIGHTS.TOPIC_SIMILARITY * 0.7,
      reason: 'Challenge yourself with advanced material',
      reasonType: 'COMPLEMENT',
    }
  }

  return null
}

/**
 * Score based on skill gaps from quiz performance
 */
function calculateSkillGapScore(
  course: ScoringContext['allCourses'][0],
  context: ScoringContext
): { score: number; reason: string; reasonType: RecommendationType } | null {
  if (context.quizScores.size === 0) return null

  // Calculate average quiz performance
  let totalScore = 0
  let totalMaxScore = 0

  for (const [, quiz] of context.quizScores) {
    totalScore += quiz.score
    totalMaxScore += quiz.maxScore
  }

  if (totalMaxScore === 0) return null

  const averagePerformance = totalScore / totalMaxScore

  // If performance is below 70%, recommend foundational courses
  if (averagePerformance < 0.7 && course.difficulty === 'Beginner') {
    return {
      score: WEIGHTS.SKILL_GAP,
      reason: 'Strengthen your foundational skills',
      reasonType: 'SKILL_GAP',
    }
  }

  // If performance is above 90%, recommend advanced courses
  if (averagePerformance > 0.9 && course.difficulty === 'Advanced') {
    return {
      score: WEIGHTS.SKILL_GAP * 0.8,
      reason: 'You\'re ready for advanced challenges',
      reasonType: 'SKILL_GAP',
    }
  }

  return null
}

/**
 * Score based on whether prerequisites are now met
 */
function calculatePrerequisiteScore(
  course: ScoringContext['allCourses'][0],
  context: ScoringContext
): { score: number; reason: string; reasonType: RecommendationType } | null {
  if (course.prerequisites.length === 0) return null

  // Check if all prerequisites are completed
  const allPrerequisitesMet = course.prerequisites.every(
    prereq => context.completedCourseIds.has(prereq)
  )

  if (allPrerequisitesMet) {
    // Check if any prerequisite was recently completed
    const recentlyCompletedPrereq = context.recentlyCompletedCourses.find(
      c => course.prerequisites.includes(c.courseId)
    )

    if (recentlyCompletedPrereq) {
      return {
        score: WEIGHTS.PREREQUISITES,
        reason: 'You\'re ready for this!',
        reasonType: 'PREREQUISITE_MET',
      }
    }
  }

  return null
}

/**
 * Score based on course popularity
 */
function calculatePopularityScore(
  course: ScoringContext['allCourses'][0],
  context: ScoringContext
): { score: number; reason: string; reasonType: RecommendationType } | null {
  // Calculate max enrollment for normalization
  const maxEnrollment = Math.max(
    ...context.allCourses.map(c => c.enrollmentCount),
    1
  )

  // Normalize enrollment count
  const normalizedPopularity = course.enrollmentCount / maxEnrollment

  // Only recommend if reasonably popular (top 50%)
  if (normalizedPopularity >= 0.5) {
    return {
      score: WEIGHTS.POPULARITY * normalizedPopularity,
      reason: 'Popular with learners like you',
      reasonType: 'POPULAR',
    }
  }

  // Provide baseline score for all courses to ensure new courses get some visibility
  if (course.enrollmentCount > 0) {
    return {
      score: WEIGHTS.POPULARITY * 0.3,
      reason: 'Trending course',
      reasonType: 'POPULAR',
    }
  }

  return null
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely parse JSON string, returning default value on error
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
 * Get reason message for a recommendation type
 */
export function getReasonMessage(
  reasonType: RecommendationType,
  context?: { pathName?: string; courseName?: string; skill?: string }
): string {
  switch (reasonType) {
    case 'CONTINUE_PATH':
      return context?.pathName
        ? `Continue your ${context.pathName} journey`
        : 'Continue your learning path'
    case 'SIMILAR_TOPIC':
      return context?.courseName
        ? `Because you completed ${context.courseName}`
        : 'Based on your completed courses'
    case 'SKILL_GAP':
      return context?.skill
        ? `Strengthen your ${context.skill} skills`
        : 'Fill gaps in your knowledge'
    case 'POPULAR':
      return 'Popular with learners like you'
    case 'PREREQUISITE_MET':
      return 'You\'re ready for this!'
    case 'COMPLEMENT':
      return context?.courseName
        ? `Pairs well with ${context.courseName}`
        : 'Complements your recent learning'
    default:
      return 'Recommended for you'
  }
}
