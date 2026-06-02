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
import { recordActivityAndUpdateStreak } from '@/lib/streak-service'
import { runAchievementsCheck } from '@/lib/achievements-service'
import { serverAnalytics } from '@/lib/analytics-server'

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
          const streakResult = await recordActivityAndUpdateStreak(userId, {
            lessonsCompleted: 1,
            xpEarned: xpAwarded,
          })
          streakData = {
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak,
            streakAction: streakResult.streakAction,
          }

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

      // Evaluate achievements server-side on a new completion (non-fatal)
      try {
        await runAchievementsCheck(userId)
      } catch (achError) {
        void achError
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
