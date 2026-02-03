import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { markLessonCompleteSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import {
  awardLessonCompleteXp,
  hasReceivedXpFor,
  awardStreakBonusXp,
} from '@/lib/xp-service'
import { serverAnalytics } from '@/lib/analytics-server'

/**
 * Helper to get the start of today in UTC
 */
function getTodayStart(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Helper to get the start of yesterday in UTC
 */
function getYesterdayStart(): Date {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  return yesterday
}

/**
 * Record daily activity and update streak
 * Internal helper function to keep streak logic consistent
 */
async function recordActivityAndUpdateStreak(
  userId: string,
  lessonsCompleted: number = 1,
  xpEarned: number = 0
): Promise<{
  currentStreak: number
  longestStreak: number
  streakAction: 'started' | 'continued' | 'extended' | 'maintained'
}> {
  // Get current user streak data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
      streakFreezes: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const today = getTodayStart()
  const yesterday = getYesterdayStart()

  // Upsert today's activity record
  await prisma.dailyActivity.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      xpEarned: xpEarned,
      lessonsCompleted: lessonsCompleted,
      quizzesTaken: 0,
      timeSpentMinutes: 0,
    },
    update: {
      xpEarned: { increment: xpEarned },
      lessonsCompleted: { increment: lessonsCompleted },
    },
  })

  // Calculate streak updates
  let newStreak = user.currentStreak
  let newLongestStreak = user.longestStreak
  let streakAction: 'started' | 'continued' | 'extended' | 'maintained' = 'maintained'

  if (user.lastActivityDate) {
    const lastActivity = new Date(user.lastActivityDate)
    lastActivity.setHours(0, 0, 0, 0)

    if (lastActivity.getTime() === today.getTime()) {
      // Already active today - maintain current streak
      streakAction = 'maintained'
    } else if (lastActivity.getTime() === yesterday.getTime()) {
      // Consecutive day - extend streak
      newStreak = user.currentStreak + 1
      streakAction = 'extended'
    } else {
      // Streak was broken - check if freeze should be used
      const daysSinceActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceActivity === 2 && user.streakFreezes > 0) {
        // One day missed, use freeze automatically if available
        newStreak = user.currentStreak + 1
        streakAction = 'continued'

        await prisma.user.update({
          where: { id: userId },
          data: {
            streakFreezes: { decrement: 1 },
          },
        })
      } else {
        // Streak is broken - restart at 1
        newStreak = 1
        streakAction = 'started'
      }
    }
  } else {
    // First activity ever - start streak at 1
    newStreak = 1
    streakAction = 'started'
  }

  // Update longest streak if needed
  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak
  }

  // Update user's streak data
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
    },
  })

  return {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    streakAction,
  }
}

/**
 * POST /api/progress/lessons
 * Marks a lesson as complete for a user
 * Also awards XP and records streak activity
 * @body userId - The user ID
 * @body courseId - The course ID
 * @body lessonId - The lesson ID to mark complete
 * @returns Updated progress information including XP and streak data
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, markLessonCompleteSchema)

    const { userId, courseId, lessonId } = body

    // Authorization: Users can only mark their own lessons complete
    requireOwnership(request, userId, 'progress')

    // Get lesson title for XP description
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true },
    })

    // Find or create course progress for this user
    let courseProgress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
      include: {
        completedLessons: true,
      },
    })

    // Track if this is a new completion (for XP)
    let isNewCompletion = false

    if (!courseProgress) {
      // Create new progress record
      courseProgress = await prisma.courseProgress.create({
        data: {
          userId,
          courseId,
          completedLessons: {
            connect: { id: lessonId },
          },
          lastAccessed: new Date(),
        },
        include: {
          completedLessons: true,
        },
      })
      isNewCompletion = true
    } else {
      // Check if lesson is already completed
      const isAlreadyCompleted = courseProgress.completedLessons.some(
        (completedLesson) => completedLesson.id === lessonId
      )

      if (!isAlreadyCompleted) {
        // Update progress to include this lesson
        courseProgress = await prisma.courseProgress.update({
          where: {
            id: courseProgress.id,
          },
          data: {
            completedLessons: {
              connect: { id: lessonId },
            },
            lastAccessed: new Date(),
          },
          include: {
            completedLessons: true,
          },
        })
        isNewCompletion = true
      } else {
        // Just update last accessed time
        courseProgress = await prisma.courseProgress.update({
          where: {
            id: courseProgress.id,
          },
          data: {
            lastAccessed: new Date(),
          },
          include: {
            completedLessons: true,
          },
        })
      }
    }

    // Award XP and record streak for new completions
    let xpAwarded = 0
    let leveledUp = false
    let streakData = null

    if (isNewCompletion) {
      // Check if XP has already been awarded for this lesson (prevents duplicates)
      const alreadyAwarded = await hasReceivedXpFor(userId, 'LESSON_COMPLETE', lessonId)

      if (!alreadyAwarded) {
        try {
          const xpResult = await awardLessonCompleteXp(userId, lessonId, lesson?.title)
          xpAwarded = xpResult.xpAwarded
          leveledUp = xpResult.leveledUp

          // Check for streak bonus milestones
          const streakResult = await recordActivityAndUpdateStreak(userId, 1, xpAwarded)
          streakData = streakResult

          // Award streak bonus if hitting milestones (7 days, 30 days)
          if (streakResult.streakAction === 'extended') {
            const bonusResult = await awardStreakBonusXp(userId, streakResult.currentStreak)
            if (bonusResult) {
              xpAwarded += bonusResult.xpAwarded
              leveledUp = leveledUp || bonusResult.leveledUp
            }
          }
        } catch (xpError) {
          // XP errors should not fail the lesson completion - silently continue
          void xpError
        }
      }
    }

    // Track analytics for new completions
    if (isNewCompletion) {
      serverAnalytics.trackLessonCompleted(userId, {
        lesson_id: lessonId,
        course_id: courseId,
        lesson_title: lesson?.title,
        xp_awarded: xpAwarded,
        is_new_completion: true,
      })

      // Track streak update if applicable
      if (streakData) {
        serverAnalytics.trackStreakUpdate(userId, {
          current_streak: streakData.currentStreak,
          longest_streak: streakData.longestStreak,
          streak_action: streakData.streakAction,
        })
      }

      // Track level up if applicable
      if (leveledUp) {
        // Note: Would need to fetch the actual level data for complete tracking
        serverAnalytics.track(userId, 'level_up_from_lesson', {
          lesson_id: lessonId,
          course_id: courseId,
        })
      }
    }

    return apiSuccess(
      {
        progressId: courseProgress.id,
        completedLessonsCount: courseProgress.completedLessons.length,
        lastAccessed: courseProgress.lastAccessed,
        // Engagement data
        xpAwarded,
        leveledUp,
        streak: streakData,
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/progress/lessons?userId=xxx&courseId=xxx
 * Gets progress for a specific user and course
 * @query userId - The user ID
 * @query courseId - The course ID
 * @returns Progress information with completed lessons
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')

    if (!userId || !courseId) {
      return apiSuccess({ completedLessons: [], totalCompleted: 0 })
    }

    // Authorization: Users can only view their own progress
    requireOwnership(request, userId, 'progress')

    const progress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
      include: {
        completedLessons: {
          select: {
            id: true,
            title: true,
          },
        },
        quizScores: true,
      },
    })

    if (!progress) {
      return apiSuccess({ completedLessons: [], totalCompleted: 0 })
    }

    return apiSuccess({
      completedLessons: progress.completedLessons,
      totalCompleted: progress.completedLessons.length,
      quizScores: progress.quizScores,
      lastAccessed: progress.lastAccessed,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
