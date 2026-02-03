import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { recordActivitySchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'

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
 * POST /api/streaks/record
 * Record daily activity and update streak
 * This should be called when user completes lessons, quizzes, or any learning activity
 *
 * @body userId - The user ID
 * @body xpEarned - Optional XP earned in this activity
 * @body lessonsCompleted - Optional number of lessons completed
 * @body quizzesTaken - Optional number of quizzes taken
 * @body timeSpentMinutes - Optional time spent learning in minutes
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, recordActivitySchema)
    const { userId, xpEarned, lessonsCompleted, quizzesTaken, timeSpentMinutes } = body

    // Authorization: Users can only record their own activity
    requireOwnership(request, userId, 'activity')

    // Check if user exists
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
      throw new NotFoundError('User')
    }

    const today = getTodayStart()
    const yesterday = getYesterdayStart()

    // Upsert today's activity record
    const dailyActivity = await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        xpEarned: xpEarned || 0,
        lessonsCompleted: lessonsCompleted || 0,
        quizzesTaken: quizzesTaken || 0,
        timeSpentMinutes: timeSpentMinutes || 0,
      },
      update: {
        xpEarned: { increment: xpEarned || 0 },
        lessonsCompleted: { increment: lessonsCompleted || 0 },
        quizzesTaken: { increment: quizzesTaken || 0 },
        timeSpentMinutes: { increment: timeSpentMinutes || 0 },
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
          // The freeze preserves the streak from yesterday
          newStreak = user.currentStreak + 1
          streakAction = 'continued'

          // Note: We'll decrement streakFreezes in the update below
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: today,
      },
      select: {
        id: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezes: true,
      },
    })

    return apiSuccess({
      userId: updatedUser.id,
      currentStreak: updatedUser.currentStreak,
      longestStreak: updatedUser.longestStreak,
      lastActivityDate: updatedUser.lastActivityDate,
      streakFreezes: updatedUser.streakFreezes,
      streakAction,
      todayActivity: {
        date: dailyActivity.date,
        xpEarned: dailyActivity.xpEarned,
        lessonsCompleted: dailyActivity.lessonsCompleted,
        quizzesTaken: dailyActivity.quizzesTaken,
        timeSpentMinutes: dailyActivity.timeSpentMinutes,
      },
    }, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}
