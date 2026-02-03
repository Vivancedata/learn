import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  ApiError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { useStreakFreezeSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'

/**
 * POST /api/streaks/freeze
 * Use a streak freeze to prevent streak from breaking
 * A streak freeze can be used when the user missed yesterday's activity
 * to preserve their current streak
 *
 * @body userId - The user ID
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, useStreakFreezeSchema)
    const { userId } = body

    // Authorization: Users can only use their own streak freezes
    requireOwnership(request, userId, 'streak freeze')

    // Check if user exists and get current streak data
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

    // Check if user has streak freezes available
    if (user.streakFreezes <= 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'No streak freezes available. Complete learning activities to earn more freezes.'
      )
    }

    // Check if there's a streak to protect
    if (user.currentStreak === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'No active streak to protect. Start learning to build a streak!'
      )
    }

    // Check if freeze is needed (user missed yesterday)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (user.lastActivityDate) {
      const lastActivity = new Date(user.lastActivityDate)
      lastActivity.setHours(0, 0, 0, 0)

      // If last activity was today, no need for freeze
      if (lastActivity.getTime() === today.getTime()) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'You were already active today. No freeze needed!'
        )
      }

      // If last activity was yesterday, no need for freeze yet
      if (lastActivity.getTime() === yesterday.getTime()) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Your streak is still active! Complete a lesson today to extend it.'
        )
      }

      // Calculate days since last activity
      const daysSinceActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Freeze can only protect one missed day
      if (daysSinceActivity > 2) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Too much time has passed. A streak freeze can only protect one missed day.'
        )
      }
    }

    // Use the streak freeze - update lastActivityDate to yesterday
    // This effectively "fills in" the missed day
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        streakFreezes: { decrement: 1 },
        lastActivityDate: yesterday,
      },
      select: {
        id: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezes: true,
      },
    })

    // Create a placeholder activity record for the frozen day
    await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId,
          date: yesterday,
        },
      },
      create: {
        userId,
        date: yesterday,
        xpEarned: 0,
        lessonsCompleted: 0,
        quizzesTaken: 0,
        timeSpentMinutes: 0,
      },
      update: {}, // Don't update if already exists
    })

    return apiSuccess({
      userId: updatedUser.id,
      currentStreak: updatedUser.currentStreak,
      longestStreak: updatedUser.longestStreak,
      lastActivityDate: updatedUser.lastActivityDate,
      streakFreezes: updatedUser.streakFreezes,
      message: 'Streak freeze used successfully! Your streak is protected.',
      freezeAppliedTo: yesterday,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
