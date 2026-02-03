/**
 * Push Notification Subscription API
 * POST - Subscribe to push notifications
 * DELETE - Unsubscribe from push notifications
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
import { pushSubscriptionSchema, unsubscribePushSchema } from '@/lib/validations'
import prisma from '@/lib/db'

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, pushSubscriptionSchema)

    // Verify user owns this subscription
    requireOwnership(request, body.userId, 'push subscription')

    // Check if subscription already exists
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint: body.subscription.endpoint },
    })

    if (existingSubscription) {
      // Update existing subscription
      const updated = await prisma.pushSubscription.update({
        where: { endpoint: body.subscription.endpoint },
        data: {
          userId: body.userId,
          p256dh: body.subscription.keys.p256dh,
          auth: body.subscription.keys.auth,
        },
      })

      return apiSuccess({ subscription: updated, updated: true }, HTTP_STATUS.OK)
    }

    // Create new subscription
    const subscription = await prisma.pushSubscription.create({
      data: {
        userId: body.userId,
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
      },
    })

    // Ensure notification preferences exist for the user
    await prisma.notificationPreference.upsert({
      where: { userId: body.userId },
      create: {
        userId: body.userId,
        streakReminders: true,
        courseUpdates: true,
        achievementAlerts: true,
        weeklyProgress: true,
        communityReplies: true,
        marketingEmails: false,
      },
      update: {},
    })

    return apiSuccess({ subscription, created: true }, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, unsubscribePushSchema)

    // Verify user owns this subscription
    requireOwnership(request, body.userId, 'push subscription')

    // Find the subscription
    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint: body.endpoint },
    })

    if (!subscription) {
      throw new NotFoundError('Push subscription')
    }

    // Verify ownership
    if (subscription.userId !== body.userId) {
      throw new NotFoundError('Push subscription')
    }

    // Delete the subscription
    await prisma.pushSubscription.delete({
      where: { endpoint: body.endpoint },
    })

    return apiSuccess({ unsubscribed: true }, HTTP_STATUS.OK)
  } catch (error) {
    return handleApiError(error)
  }
}
