/**
 * Server-side analytics helper for PostHog
 *
 * This module provides analytics tracking for API routes and server-side operations.
 * All operations are non-blocking and fail silently to not affect API performance.
 *
 * Usage:
 * ```typescript
 * import { serverAnalytics } from '@/lib/analytics-server'
 *
 * // In an API route
 * serverAnalytics.trackLessonCompleted(userId, {
 *   lesson_id: lessonId,
 *   course_id: courseId,
 * })
 * ```
 */

import { PostHog } from 'posthog-node'

// ============================================================================
// Server-side PostHog Client
// ============================================================================

let posthogClient: PostHog | null = null

/**
 * Get or create the PostHog client
 * Returns null if API key is not configured
 */
function getClient(): PostHog | null {
  if (posthogClient) return posthogClient

  const apiKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (!apiKey) {
    return null
  }

  posthogClient = new PostHog(apiKey, {
    host: apiHost,
    // Flush events in batches
    flushAt: 20,
    flushInterval: 10000, // 10 seconds
  })

  return posthogClient
}

/**
 * Ensure events are flushed before process ends
 * Call this in API routes that need immediate event delivery
 */
export async function flushAnalytics(): Promise<void> {
  const client = getClient()
  if (client) {
    try {
      await client.flush()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Server Analytics] Failed to flush:', error)
      }
    }
  }
}

// ============================================================================
// Event Types
// ============================================================================

export interface LessonCompletedEvent {
  lesson_id: string
  course_id: string
  lesson_title?: string
  lesson_type?: 'lesson' | 'project' | 'quiz'
  xp_awarded?: number
  is_new_completion?: boolean
}

export interface QuizCompletedEvent {
  lesson_id: string
  course_id: string
  score: number
  max_score: number
  percentage: number
  passed: boolean
}

export interface StreakEvent {
  current_streak: number
  longest_streak: number
  streak_action: 'started' | 'continued' | 'extended' | 'maintained'
  xp_bonus?: number
}

export interface LevelUpEvent {
  new_level: number
  previous_level: number
  total_xp: number
}

export interface ProjectSubmittedEvent {
  lesson_id: string
  course_id?: string
  github_url?: string
  has_live_demo: boolean
}

export interface AchievementEvent {
  achievement_id: string
  achievement_name: string
  category?: string
  xp_earned?: number
}

export interface SubscriptionEvent {
  plan: 'free' | 'pro' | 'enterprise'
  billing_cycle?: 'monthly' | 'yearly'
  price?: number
  action: 'started' | 'upgraded' | 'downgraded' | 'cancelled'
}

// ============================================================================
// Server Analytics Class
// ============================================================================

class ServerAnalytics {
  /**
   * Track a generic event
   */
  track(
    userId: string,
    event: string,
    properties?: Record<string, unknown> | object
  ): void {
    const client = getClient()
    if (!client) return

    try {
      client.capture({
        distinctId: userId,
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          source: 'server',
        },
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Server Analytics] Failed to track:', event, error)
      }
    }
  }

  /**
   * Identify a user with properties
   */
  identify(userId: string, properties?: Record<string, unknown>): void {
    const client = getClient()
    if (!client) return

    try {
      client.identify({
        distinctId: userId,
        properties: {
          ...properties,
          last_seen: new Date().toISOString(),
        },
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Server Analytics] Failed to identify:', error)
      }
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(userId: string, properties: Record<string, unknown>): void {
    const client = getClient()
    if (!client) return

    try {
      client.identify({
        distinctId: userId,
        properties,
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Server Analytics] Failed to set properties:', error)
      }
    }
  }

  // ============================================================================
  // Typed Event Methods
  // ============================================================================

  /**
   * Track lesson completed
   */
  trackLessonCompleted(userId: string, event: LessonCompletedEvent): void {
    this.track(userId, 'lesson_completed', event)
  }

  /**
   * Track quiz completed
   */
  trackQuizCompleted(userId: string, event: QuizCompletedEvent): void {
    this.track(userId, 'quiz_completed', event)
  }

  /**
   * Track streak update
   */
  trackStreakUpdate(userId: string, event: StreakEvent): void {
    this.track(userId, 'streak_updated', event)

    // Also track milestone achievements
    if (event.streak_action === 'extended') {
      const milestones = [7, 14, 30, 60, 90, 180, 365]
      if (milestones.includes(event.current_streak)) {
        this.track(userId, 'streak_milestone_reached', {
          milestone: event.current_streak,
          xp_bonus: event.xp_bonus,
        })
      }
    }
  }

  /**
   * Track level up
   */
  trackLevelUp(userId: string, event: LevelUpEvent): void {
    this.track(userId, 'level_up', event)
  }

  /**
   * Track project submitted
   */
  trackProjectSubmitted(userId: string, event: ProjectSubmittedEvent): void {
    this.track(userId, 'project_submitted', event)
  }

  /**
   * Track project reviewed
   */
  trackProjectReviewed(
    userId: string,
    projectId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string
  ): void {
    this.track(userId, `project_${status}`, {
      project_id: projectId,
      reviewed_by: reviewedBy,
    })
  }

  /**
   * Track achievement unlocked
   */
  trackAchievementUnlocked(userId: string, event: AchievementEvent): void {
    this.track(userId, 'achievement_unlocked', event)
  }

  /**
   * Track subscription event
   */
  trackSubscription(userId: string, event: SubscriptionEvent): void {
    this.track(userId, `subscription_${event.action}`, event)
  }

  /**
   * Track course enrollment
   */
  trackCourseEnrolled(
    userId: string,
    courseId: string,
    courseTitle?: string,
    pathId?: string
  ): void {
    this.track(userId, 'course_enrolled', {
      course_id: courseId,
      course_title: courseTitle,
      path_id: pathId,
    })
  }

  /**
   * Track course completion
   */
  trackCourseCompleted(
    userId: string,
    courseId: string,
    courseTitle?: string,
    totalLessons?: number,
    timeSpentDays?: number
  ): void {
    this.track(userId, 'course_completed', {
      course_id: courseId,
      course_title: courseTitle,
      total_lessons: totalLessons,
      time_spent_days: timeSpentDays,
    })
  }

  /**
   * Track assessment completed
   */
  trackAssessmentCompleted(
    userId: string,
    assessmentId: string,
    score: number,
    maxScore: number,
    passed: boolean,
    assessmentType?: string
  ): void {
    this.track(userId, 'assessment_completed', {
      assessment_id: assessmentId,
      assessment_type: assessmentType,
      score,
      max_score: maxScore,
      percentage: Math.round((score / maxScore) * 100),
      passed,
    })
  }

  /**
   * Track discussion created
   */
  trackDiscussionCreated(
    userId: string,
    discussionId: string,
    courseId?: string,
    lessonId?: string
  ): void {
    this.track(userId, 'discussion_created', {
      discussion_id: discussionId,
      course_id: courseId,
      lesson_id: lessonId,
    })
  }

  /**
   * Track reply created
   */
  trackReplyCreated(
    userId: string,
    replyId: string,
    discussionId: string
  ): void {
    this.track(userId, 'reply_created', {
      reply_id: replyId,
      discussion_id: discussionId,
    })
  }

  /**
   * Track XP earned
   */
  trackXpEarned(
    userId: string,
    amount: number,
    source: string,
    sourceId?: string
  ): void {
    this.track(userId, 'xp_earned', {
      amount,
      source,
      source_id: sourceId,
    })
  }

  /**
   * Track API error
   */
  trackApiError(
    userId: string | undefined,
    endpoint: string,
    errorType: string,
    errorMessage: string
  ): void {
    const distinctId = userId || 'anonymous'
    this.track(distinctId, 'api_error', {
      endpoint,
      error_type: errorType,
      error_message: errorMessage,
    })
  }
}

// Export singleton instance
export const serverAnalytics = new ServerAnalytics()

// Export for direct client access if needed
export { getClient as getPostHogClient }
