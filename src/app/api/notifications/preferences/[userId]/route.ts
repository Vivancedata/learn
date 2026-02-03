/**
 * Notification Preferences API
 * GET - Get user's notification preferences
 * PUT - Update user's notification preferences
 */

import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { notificationPreferencesSchema, userIdParamsSchema } from '@/lib/validations'
import prisma from '@/lib/db'

/**
 * GET /api/notifications/preferences/[userId]
 * Get notification preferences for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Validate userId
    userIdParamsSchema.parse({ userId })

    // Verify user is requesting their own preferences
    requireOwnership(request, userId, 'notification preferences')

    // Get or create preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          streakReminders: true,
          courseUpdates: true,
          achievementAlerts: true,
          weeklyProgress: true,
          communityReplies: true,
          marketingEmails: false,
        },
      })
    }

    return apiSuccess(preferences, HTTP_STATUS.OK)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/notifications/preferences/[userId]
 * Update notification preferences for a user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Validate userId
    userIdParamsSchema.parse({ userId })

    // Verify user is updating their own preferences
    requireOwnership(request, userId, 'notification preferences')

    // Parse and validate request body
    const body = await parseRequestBody(request, notificationPreferencesSchema)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        streakReminders: body.streakReminders ?? true,
        courseUpdates: body.courseUpdates ?? true,
        achievementAlerts: body.achievementAlerts ?? true,
        weeklyProgress: body.weeklyProgress ?? true,
        communityReplies: body.communityReplies ?? true,
        marketingEmails: body.marketingEmails ?? false,
        quietHoursStart: body.quietHoursStart ?? null,
        quietHoursEnd: body.quietHoursEnd ?? null,
      },
      update: {
        ...(body.streakReminders !== undefined && { streakReminders: body.streakReminders }),
        ...(body.courseUpdates !== undefined && { courseUpdates: body.courseUpdates }),
        ...(body.achievementAlerts !== undefined && { achievementAlerts: body.achievementAlerts }),
        ...(body.weeklyProgress !== undefined && { weeklyProgress: body.weeklyProgress }),
        ...(body.communityReplies !== undefined && { communityReplies: body.communityReplies }),
        ...(body.marketingEmails !== undefined && { marketingEmails: body.marketingEmails }),
        ...(body.quietHoursStart !== undefined && { quietHoursStart: body.quietHoursStart }),
        ...(body.quietHoursEnd !== undefined && { quietHoursEnd: body.quietHoursEnd }),
      },
    })

    return apiSuccess(preferences, HTTP_STATUS.OK)
  } catch (error) {
    return handleApiError(error)
  }
}
