import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { recordActivitySchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import { recordActivityAndUpdateStreak } from '@/lib/streak-service'

/**
 * POST /api/streaks/record
 * Record daily activity and update streak.
 * This should be called when a user completes lessons, quizzes, or any
 * learning activity.
 *
 * @body userId - The user ID
 * @body xpEarned - Optional XP earned in this activity
 * @body lessonsCompleted - Optional number of lessons completed
 * @body quizzesTaken - Optional number of quizzes taken
 * @body timeSpentMinutes - Optional time spent learning in minutes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, recordActivitySchema)
    const { userId, xpEarned, lessonsCompleted, quizzesTaken, timeSpentMinutes } = body

    // Authorization: Users can only record their own activity
    requireOwnership(request, userId, 'activity')

    const result = await recordActivityAndUpdateStreak(userId, {
      xpEarned,
      lessonsCompleted,
      quizzesTaken,
      timeSpentMinutes,
    })

    return apiSuccess(result, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}
