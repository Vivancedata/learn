/**
 * Send Push Notification API
 * POST - Send a push notification to a user
 * This endpoint is for internal/admin use
 */

import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { sendNotificationSchema } from '@/lib/validations'
import { requireRole } from '@/lib/auth'
import prisma from '@/lib/db'
import { sendPushNotification, isWithinQuietHours } from '@/lib/push-notifications'

/**
 * POST /api/notifications/send
 * Send a push notification to a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, sendNotificationSchema)

    // Get the authenticated user from middleware headers
    const authenticatedUserId = request.headers.get('x-user-id')

    // Users may send test notifications to themselves; sending to any other
    // user requires the admin role (consistent with other admin endpoints).
    if (authenticatedUserId !== body.userId) {
      await requireRole(request, ['admin'])
    }

    // Get user and their notification preferences
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      include: {
        notificationPreference: true,
        pushSubscriptions: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Check if user has any push subscriptions
    if (user.pushSubscriptions.length === 0) {
      return apiSuccess({
        sent: false,
        reason: 'No push subscriptions found for user',
      }, HTTP_STATUS.OK)
    }

    // Check quiet hours
    if (user.notificationPreference && isWithinQuietHours(user.notificationPreference)) {
      return apiSuccess({
        sent: false,
        reason: 'User is in quiet hours',
        quietHoursStart: user.notificationPreference.quietHoursStart,
        quietHoursEnd: user.notificationPreference.quietHoursEnd,
      }, HTTP_STATUS.OK)
    }

    // Prepare notification payload
    const payload = {
      title: body.title,
      body: body.body,
      icon: body.icon || '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: body.tag || 'default',
      data: {
        url: body.url || '/',
        ...body.data,
      },
      requireInteraction: body.requireInteraction || false,
    }

    // Send to all user's subscriptions
    const results = await Promise.allSettled(
      user.pushSubscriptions.map((subscription) =>
        sendPushNotification(subscription, payload)
      )
    )

    // Process results and clean up failed subscriptions
    let successCount = 0
    let failureCount = 0
    const failedEndpoints: string[] = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const subscription = user.pushSubscriptions[i]

      if (result.status === 'fulfilled' && result.value.success) {
        successCount++
      } else {
        failureCount++

        // If subscription is invalid, delete it
        if (result.status === 'rejected' || !result.value.success) {
          failedEndpoints.push(subscription.endpoint)

          // Delete invalid subscription
          try {
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint },
            })
          } catch {
            // Ignore deletion errors
          }
        }
      }
    }

    return apiSuccess({
      sent: successCount > 0,
      successCount,
      failureCount,
      totalSubscriptions: user.pushSubscriptions.length,
      cleanedUpSubscriptions: failedEndpoints.length,
    }, HTTP_STATUS.OK)
  } catch (error) {
    return handleApiError(error)
  }
}
