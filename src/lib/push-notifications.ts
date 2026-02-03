/**
 * Server-side Push Notification Utilities
 * Handles sending push notifications via Web Push protocol
 */

import webpush from 'web-push'
import prisma from './db'

// Types for push notifications
export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  image?: string
  renotify?: boolean
}

export interface NotificationPreferences {
  streakReminders: boolean
  courseUpdates: boolean
  achievementAlerts: boolean
  weeklyProgress: boolean
  communityReplies: boolean
  marketingEmails: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
}

// Notification types for filtering
export type NotificationType =
  | 'streak_reminder'
  | 'course_update'
  | 'achievement'
  | 'weekly_progress'
  | 'community_reply'
  | 'marketing'
  | 'system'

// Initialize web-push with VAPID details
function initializeWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:hello@vivancedata.com'

  if (!publicKey || !privateKey) {
    console.warn('[Push] VAPID keys not configured. Push notifications disabled.')
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

// Check if web push is configured
let webPushInitialized = false

function ensureWebPushInitialized(): boolean {
  if (!webPushInitialized) {
    webPushInitialized = initializeWebPush()
  }
  return webPushInitialized
}

/**
 * Send a push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!ensureWebPushInitialized()) {
    return { success: false, error: 'Push notifications not configured' }
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours
        urgency: 'normal',
      }
    )

    return { success: true }
  } catch (error) {
    const webPushError = error as { statusCode?: number; message?: string }

    // Handle specific push errors
    if (webPushError.statusCode === 404 || webPushError.statusCode === 410) {
      // Subscription is no longer valid
      return {
        success: false,
        error: 'Subscription expired or invalid',
      }
    }

    console.error('[Push] Failed to send notification:', webPushError.message)
    return {
      success: false,
      error: webPushError.message || 'Unknown error',
    }
  }
}

/**
 * Send a push notification to a user (all their subscriptions)
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload,
  notificationType: NotificationType = 'system'
): Promise<{ sent: boolean; count: number }> {
  // Get user with their subscriptions and preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      pushSubscriptions: true,
      notificationPreference: true,
    },
  })

  if (!user || user.pushSubscriptions.length === 0) {
    return { sent: false, count: 0 }
  }

  // Check if this notification type is enabled
  if (user.notificationPreference && !isNotificationTypeEnabled(user.notificationPreference, notificationType)) {
    return { sent: false, count: 0 }
  }

  // Check quiet hours
  if (user.notificationPreference && isWithinQuietHours(user.notificationPreference)) {
    return { sent: false, count: 0 }
  }

  // Send to all subscriptions
  let sentCount = 0
  const invalidSubscriptions: string[] = []

  for (const subscription of user.pushSubscriptions) {
    const result = await sendPushNotification(subscription, payload)

    if (result.success) {
      sentCount++
    } else if (result.error === 'Subscription expired or invalid') {
      invalidSubscriptions.push(subscription.endpoint)
    }
  }

  // Clean up invalid subscriptions
  if (invalidSubscriptions.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: { in: invalidSubscriptions },
      },
    })
  }

  return { sent: sentCount > 0, count: sentCount }
}

/**
 * Check if a notification type is enabled for the user
 */
function isNotificationTypeEnabled(
  preferences: NotificationPreferences,
  type: NotificationType
): boolean {
  switch (type) {
    case 'streak_reminder':
      return preferences.streakReminders
    case 'course_update':
      return preferences.courseUpdates
    case 'achievement':
      return preferences.achievementAlerts
    case 'weekly_progress':
      return preferences.weeklyProgress
    case 'community_reply':
      return preferences.communityReplies
    case 'marketing':
      return preferences.marketingEmails
    case 'system':
      return true // System notifications always enabled
    default:
      return true
  }
}

/**
 * Check if current time is within user's quiet hours
 */
export function isWithinQuietHours(
  preferences: Pick<NotificationPreferences, 'quietHoursStart' | 'quietHoursEnd'>
): boolean {
  const { quietHoursStart, quietHoursEnd } = preferences

  if (quietHoursStart === null || quietHoursEnd === null) {
    return false
  }

  const now = new Date()
  const currentHour = now.getHours()

  // Handle cases where quiet hours span midnight
  if (quietHoursStart <= quietHoursEnd) {
    // Normal case: e.g., 22:00 to 07:00 is NOT spanning midnight (22-7 doesn't work)
    // Wait, that does span midnight. Let me reconsider.
    // If start < end, quiet hours are within same day: e.g., 10:00 to 14:00
    return currentHour >= quietHoursStart && currentHour < quietHoursEnd
  } else {
    // Spanning midnight: e.g., 22:00 to 07:00
    return currentHour >= quietHoursStart || currentHour < quietHoursEnd
  }
}

// ============================================================================
// Pre-built Notification Templates
// ============================================================================

/**
 * Send a streak reminder notification
 */
export async function sendStreakReminder(userId: string, currentStreak: number) {
  const payload: NotificationPayload = {
    title: "Don't lose your streak!",
    body: currentStreak > 0
      ? `You're on a ${currentStreak}-day streak! Complete a lesson today to keep it going.`
      : 'Start your learning streak today! Complete a lesson to begin.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'streak-reminder',
    data: { url: '/dashboard' },
    requireInteraction: false,
  }

  return sendNotificationToUser(userId, payload, 'streak_reminder')
}

/**
 * Send an achievement notification
 */
export async function sendAchievementNotification(
  userId: string,
  achievementName: string,
  achievementIcon: string
) {
  const payload: NotificationPayload = {
    title: 'Achievement Unlocked!',
    body: `Congratulations! You earned: ${achievementName}`,
    icon: achievementIcon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'achievement',
    data: { url: '/dashboard' },
    requireInteraction: false,
  }

  return sendNotificationToUser(userId, payload, 'achievement')
}

/**
 * Send a course update notification
 */
export async function sendCourseUpdateNotification(
  userId: string,
  courseTitle: string,
  updateMessage: string,
  courseId: string
) {
  const payload: NotificationPayload = {
    title: `Update: ${courseTitle}`,
    body: updateMessage,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: `course-update-${courseId}`,
    data: { url: `/courses/${courseId}` },
    requireInteraction: false,
  }

  return sendNotificationToUser(userId, payload, 'course_update')
}

/**
 * Send a weekly progress notification
 */
export async function sendWeeklyProgressNotification(
  userId: string,
  lessonsCompleted: number,
  timeSpentMinutes: number
) {
  const hours = Math.floor(timeSpentMinutes / 60)
  const minutes = timeSpentMinutes % 60
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  const payload: NotificationPayload = {
    title: 'Your Weekly Progress',
    body: lessonsCompleted > 0
      ? `Great work! You completed ${lessonsCompleted} lesson${lessonsCompleted > 1 ? 's' : ''} and spent ${timeString} learning this week.`
      : 'Start learning this week! Your next lesson is waiting for you.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'weekly-progress',
    data: { url: '/dashboard' },
    requireInteraction: false,
  }

  return sendNotificationToUser(userId, payload, 'weekly_progress')
}

/**
 * Send a community reply notification
 */
export async function sendCommunityReplyNotification(
  userId: string,
  replierName: string,
  discussionPreview: string,
  discussionId: string
) {
  const preview = discussionPreview.length > 50
    ? discussionPreview.substring(0, 50) + '...'
    : discussionPreview

  const payload: NotificationPayload = {
    title: 'New Reply to Your Discussion',
    body: `${replierName} replied: "${preview}"`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: `reply-${discussionId}`,
    data: { url: `/discussions/${discussionId}` },
    requireInteraction: false,
  }

  return sendNotificationToUser(userId, payload, 'community_reply')
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null
}
