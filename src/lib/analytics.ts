/**
 * Analytics helper for PostHog integration
 *
 * This module provides a type-safe, non-blocking interface for tracking
 * analytics events. All tracking operations are wrapped in try-catch to
 * ensure failures don't affect user experience.
 *
 * Usage:
 * ```typescript
 * import { analytics } from '@/lib/analytics'
 *
 * // Track an event
 * analytics.track('lesson_completed', { lessonId: '123', courseId: 'abc' })
 *
 * // Identify a user
 * analytics.identify(userId, { email, name, plan })
 *
 * // Reset on logout
 * analytics.reset()
 * ```
 */

import posthog from 'posthog-js'

// ============================================================================
// Event Type Definitions
// ============================================================================

/**
 * User authentication events
 */
export interface UserSignedUpProperties {
  plan_type?: 'free' | 'pro' | 'enterprise'
  signup_method?: 'email' | 'github' | 'google'
  referral_source?: string
}

export interface UserSignedInProperties {
  signin_method?: 'email' | 'github' | 'google'
}

/**
 * Course and learning events
 */
export interface CourseStartedProperties {
  course_id: string
  course_title?: string
  difficulty?: string
  path_id?: string
}

export interface LessonCompletedProperties {
  lesson_id: string
  course_id: string
  lesson_title?: string
  lesson_type?: 'lesson' | 'project' | 'quiz'
  time_spent_seconds?: number
}

export interface QuizCompletedProperties {
  quiz_id?: string
  lesson_id: string
  course_id: string
  score: number
  total_questions: number
  passed: boolean
  time_spent_seconds?: number
}

export interface AssessmentCompletedProperties {
  assessment_id: string
  assessment_type?: 'skill' | 'course' | 'path'
  score: number
  total_questions: number
  passed: boolean
  time_spent_seconds?: number
}

export interface ProjectSubmittedProperties {
  project_id?: string
  lesson_id: string
  course_id: string
  github_url?: string
  has_live_demo: boolean
}

/**
 * Engagement events
 */
export interface StreakAchievedProperties {
  streak_count: number
  previous_best?: number
}

export interface LevelUpProperties {
  new_level: number
  previous_level: number
  total_xp: number
}

export interface AchievementUnlockedProperties {
  achievement_id: string
  achievement_name: string
  achievement_category?: string
  xp_earned?: number
}

/**
 * Subscription events
 */
export interface SubscriptionStartedProperties {
  plan: 'free' | 'pro' | 'enterprise'
  billing_cycle?: 'monthly' | 'yearly'
  price?: number
  currency?: string
  trial?: boolean
}

export interface SubscriptionCancelledProperties {
  plan: 'free' | 'pro' | 'enterprise'
  reason?: string
  feedback?: string
  days_active?: number
}

/**
 * Navigation events
 */
export interface PageViewedProperties {
  page_type?: string
  course_id?: string
  lesson_id?: string
  path_id?: string
  referrer?: string
}

/**
 * Search and discovery events
 */
export interface SearchPerformedProperties {
  query: string
  results_count: number
  category?: string
}

export interface CourseEnrolledProperties {
  course_id: string
  course_title?: string
  path_id?: string
  enrollment_source?: 'browse' | 'search' | 'recommendation' | 'path'
}

/**
 * Discussion events
 */
export interface DiscussionCreatedProperties {
  discussion_id?: string
  course_id?: string
  lesson_id?: string
  content_length: number
}

export interface ReplyCreatedProperties {
  reply_id?: string
  discussion_id: string
  content_length: number
}

// ============================================================================
// Analytics Event Names
// ============================================================================

export const ANALYTICS_EVENTS = {
  // User authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',

  // Course and learning
  COURSE_STARTED: 'course_started',
  COURSE_COMPLETED: 'course_completed',
  LESSON_STARTED: 'lesson_started',
  LESSON_COMPLETED: 'lesson_completed',
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  ASSESSMENT_STARTED: 'assessment_started',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  PROJECT_SUBMITTED: 'project_submitted',
  PROJECT_APPROVED: 'project_approved',

  // Engagement
  STREAK_ACHIEVED: 'streak_achieved',
  LEVEL_UP: 'level_up',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  XP_EARNED: 'xp_earned',

  // Subscription
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_ABANDONED: 'checkout_abandoned',

  // Discovery
  SEARCH_PERFORMED: 'search_performed',
  COURSE_ENROLLED: 'course_enrolled',
  PATH_ENROLLED: 'path_enrolled',

  // Discussion
  DISCUSSION_CREATED: 'discussion_created',
  REPLY_CREATED: 'reply_created',

  // UI interactions
  FEATURE_USED: 'feature_used',
  ERROR_OCCURRED: 'error_occurred',
} as const

// ============================================================================
// User Traits for Identification
// ============================================================================

export interface UserTraits {
  email?: string
  name?: string
  plan?: 'free' | 'pro' | 'enterprise'
  level?: number
  total_xp?: number
  current_streak?: number
  courses_completed?: number
  lessons_completed?: number
  signup_date?: string
  last_active?: string
  github_username?: string
  role?: string
}

// ============================================================================
// Analytics Helper Class
// ============================================================================

/**
 * Safe wrapper for PostHog analytics operations
 * All methods are non-blocking and fail silently to not affect UX
 */
class Analytics {
  private isEnabled(): boolean {
    return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY
  }

  /**
   * Track a custom event
   * @param event - Event name
   * @param properties - Optional event properties
   */
  track(event: string, properties?: Record<string, unknown>): void {
    if (!this.isEnabled()) return

    try {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      // Silently fail - analytics should never break the app
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to track event:', event, error)
      }
    }
  }

  /**
   * Identify a user with optional traits
   * @param userId - Unique user identifier
   * @param traits - Optional user properties
   */
  identify(userId: string, traits?: UserTraits): void {
    if (!this.isEnabled()) return

    try {
      posthog.identify(userId, {
        ...traits,
        identified_at: new Date().toISOString(),
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to identify user:', error)
      }
    }
  }

  /**
   * Track a page view with context
   * Note: This is usually handled automatically by PostHogProvider
   * @param name - Page name
   * @param properties - Optional page properties
   */
  page(name: string, properties?: Record<string, unknown>): void {
    if (!this.isEnabled()) return

    try {
      posthog.capture('$pageview', {
        page_name: name,
        ...properties,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to track page view:', error)
      }
    }
  }

  /**
   * Reset analytics state (call on logout)
   * Clears user identification and starts fresh session
   */
  reset(): void {
    if (!this.isEnabled()) return

    try {
      posthog.reset()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to reset:', error)
      }
    }
  }

  /**
   * Set user properties without changing identity
   * @param properties - Properties to set
   */
  setUserProperties(properties: Record<string, unknown>): void {
    if (!this.isEnabled()) return

    try {
      posthog.people.set(properties)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to set user properties:', error)
      }
    }
  }

  /**
   * Increment a numeric user property
   * @param property - Property name
   * @param value - Value to increment by (default: 1)
   */
  incrementUserProperty(property: string, value = 1): void {
    if (!this.isEnabled()) return

    try {
      posthog.people.set_once({ [property]: 0 }) // Initialize if not exists
      posthog.people.set({ [property]: value }) // Note: PostHog JS doesn't have increment
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to increment property:', error)
      }
    }
  }

  /**
   * Alias the current user to a new ID
   * Useful for linking anonymous to authenticated users
   * @param newId - New user identifier
   */
  alias(newId: string): void {
    if (!this.isEnabled()) return

    try {
      posthog.alias(newId)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to create alias:', error)
      }
    }
  }

  /**
   * Register super properties that are sent with every event
   * @param properties - Properties to register
   */
  registerSuperProperties(properties: Record<string, unknown>): void {
    if (!this.isEnabled()) return

    try {
      posthog.register(properties)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to register super properties:', error)
      }
    }
  }

  /**
   * Opt user out of tracking
   */
  optOut(): void {
    if (!this.isEnabled()) return

    try {
      posthog.opt_out_capturing()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to opt out:', error)
      }
    }
  }

  /**
   * Opt user back into tracking
   */
  optIn(): void {
    if (!this.isEnabled()) return

    try {
      posthog.opt_in_capturing()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Failed to opt in:', error)
      }
    }
  }

  /**
   * Check if user has opted out
   */
  hasOptedOut(): boolean {
    if (!this.isEnabled()) return false

    try {
      return posthog.has_opted_out_capturing()
    } catch (_error) {
      return false
    }
  }

  // ============================================================================
  // Typed Event Helpers
  // ============================================================================

  /**
   * Track user signup
   */
  trackUserSignedUp(properties?: UserSignedUpProperties): void {
    this.track(ANALYTICS_EVENTS.USER_SIGNED_UP, properties)
  }

  /**
   * Track user signin
   */
  trackUserSignedIn(properties?: UserSignedInProperties): void {
    this.track(ANALYTICS_EVENTS.USER_SIGNED_IN, properties)
  }

  /**
   * Track user signout
   */
  trackUserSignedOut(): void {
    this.track(ANALYTICS_EVENTS.USER_SIGNED_OUT)
  }

  /**
   * Track course started
   */
  trackCourseStarted(properties: CourseStartedProperties): void {
    this.track(ANALYTICS_EVENTS.COURSE_STARTED, properties)
  }

  /**
   * Track lesson completed
   */
  trackLessonCompleted(properties: LessonCompletedProperties): void {
    this.track(ANALYTICS_EVENTS.LESSON_COMPLETED, properties)
  }

  /**
   * Track quiz completed
   */
  trackQuizCompleted(properties: QuizCompletedProperties): void {
    this.track(ANALYTICS_EVENTS.QUIZ_COMPLETED, properties)
  }

  /**
   * Track assessment completed
   */
  trackAssessmentCompleted(properties: AssessmentCompletedProperties): void {
    this.track(ANALYTICS_EVENTS.ASSESSMENT_COMPLETED, properties)
  }

  /**
   * Track project submitted
   */
  trackProjectSubmitted(properties: ProjectSubmittedProperties): void {
    this.track(ANALYTICS_EVENTS.PROJECT_SUBMITTED, properties)
  }

  /**
   * Track streak achieved
   */
  trackStreakAchieved(properties: StreakAchievedProperties): void {
    this.track(ANALYTICS_EVENTS.STREAK_ACHIEVED, properties)
  }

  /**
   * Track level up
   */
  trackLevelUp(properties: LevelUpProperties): void {
    this.track(ANALYTICS_EVENTS.LEVEL_UP, properties)
  }

  /**
   * Track achievement unlocked
   */
  trackAchievementUnlocked(properties: AchievementUnlockedProperties): void {
    this.track(ANALYTICS_EVENTS.ACHIEVEMENT_UNLOCKED, properties)
  }

  /**
   * Track subscription started
   */
  trackSubscriptionStarted(properties: SubscriptionStartedProperties): void {
    this.track(ANALYTICS_EVENTS.SUBSCRIPTION_STARTED, properties)
  }

  /**
   * Track subscription cancelled
   */
  trackSubscriptionCancelled(properties: SubscriptionCancelledProperties): void {
    this.track(ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED, properties)
  }

  /**
   * Track course enrolled
   */
  trackCourseEnrolled(properties: CourseEnrolledProperties): void {
    this.track(ANALYTICS_EVENTS.COURSE_ENROLLED, properties)
  }

  /**
   * Track search performed
   */
  trackSearchPerformed(properties: SearchPerformedProperties): void {
    this.track(ANALYTICS_EVENTS.SEARCH_PERFORMED, properties)
  }

  /**
   * Track discussion created
   */
  trackDiscussionCreated(properties: DiscussionCreatedProperties): void {
    this.track(ANALYTICS_EVENTS.DISCUSSION_CREATED, properties)
  }

  /**
   * Track reply created
   */
  trackReplyCreated(properties: ReplyCreatedProperties): void {
    this.track(ANALYTICS_EVENTS.REPLY_CREATED, properties)
  }

  /**
   * Track error occurred
   */
  trackError(errorType: string, errorMessage: string, properties?: Record<string, unknown>): void {
    this.track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: errorMessage,
      ...properties,
    })
  }
}

// Export singleton instance
export const analytics = new Analytics()

// Export event names for reference
export { ANALYTICS_EVENTS as Events }
