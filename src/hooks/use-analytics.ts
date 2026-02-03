'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { analytics, UserTraits } from '@/lib/analytics'

/**
 * Hook that provides analytics functions and handles user identification
 *
 * This hook automatically:
 * - Identifies users when they log in
 * - Resets analytics when they log out
 * - Provides convenience methods for common tracking operations
 *
 * @example
 * ```tsx
 * function LessonPage({ lessonId, courseId }) {
 *   const { trackLessonCompleted } = useAnalytics()
 *
 *   const handleComplete = () => {
 *     trackLessonCompleted({ lessonId, courseId })
 *   }
 *
 *   return <button onClick={handleComplete}>Mark Complete</button>
 * }
 * ```
 */
export function useAnalytics() {
  const { user, isAuthenticated } = useAuth()
  const previousUser = useRef<string | null>(null)

  // Identify user when they log in
  useEffect(() => {
    if (isAuthenticated && user?.id && previousUser.current !== user.id) {
      const traits: UserTraits = {
        email: user.email,
        name: user.name || undefined,
        github_username: user.githubUsername || undefined,
      }

      analytics.identify(user.id, traits)
      previousUser.current = user.id
    } else if (!isAuthenticated && previousUser.current) {
      // User logged out
      analytics.reset()
      previousUser.current = null
    }
  }, [isAuthenticated, user])

  // Generic track function
  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    analytics.track(event, properties)
  }, [])

  // User events
  const trackSignUp = useCallback((properties?: { plan_type?: 'free' | 'pro' | 'enterprise' }) => {
    analytics.trackUserSignedUp(properties)
  }, [])

  const trackSignIn = useCallback(() => {
    analytics.trackUserSignedIn()
  }, [])

  const trackSignOut = useCallback(() => {
    analytics.trackUserSignedOut()
  }, [])

  // Course events
  const trackCourseStarted = useCallback((courseId: string, courseTitle?: string, difficulty?: string) => {
    analytics.trackCourseStarted({ course_id: courseId, course_title: courseTitle, difficulty })
  }, [])

  const trackLessonCompleted = useCallback((
    lessonId: string,
    courseId: string,
    lessonTitle?: string,
    lessonType?: 'lesson' | 'project' | 'quiz',
    timeSpentSeconds?: number
  ) => {
    analytics.trackLessonCompleted({
      lesson_id: lessonId,
      course_id: courseId,
      lesson_title: lessonTitle,
      lesson_type: lessonType,
      time_spent_seconds: timeSpentSeconds,
    })
  }, [])

  const trackQuizCompleted = useCallback((
    lessonId: string,
    courseId: string,
    score: number,
    totalQuestions: number,
    passed: boolean,
    timeSpentSeconds?: number
  ) => {
    analytics.trackQuizCompleted({
      lesson_id: lessonId,
      course_id: courseId,
      score,
      total_questions: totalQuestions,
      passed,
      time_spent_seconds: timeSpentSeconds,
    })
  }, [])

  const trackAssessmentCompleted = useCallback((
    assessmentId: string,
    score: number,
    totalQuestions: number,
    passed: boolean,
    assessmentType?: 'skill' | 'course' | 'path',
    timeSpentSeconds?: number
  ) => {
    analytics.trackAssessmentCompleted({
      assessment_id: assessmentId,
      assessment_type: assessmentType,
      score,
      total_questions: totalQuestions,
      passed,
      time_spent_seconds: timeSpentSeconds,
    })
  }, [])

  const trackProjectSubmitted = useCallback((
    lessonId: string,
    courseId: string,
    hasLiveDemo: boolean,
    githubUrl?: string
  ) => {
    analytics.trackProjectSubmitted({
      lesson_id: lessonId,
      course_id: courseId,
      has_live_demo: hasLiveDemo,
      github_url: githubUrl,
    })
  }, [])

  // Engagement events
  const trackStreakAchieved = useCallback((streakCount: number, previousBest?: number) => {
    analytics.trackStreakAchieved({ streak_count: streakCount, previous_best: previousBest })
  }, [])

  const trackLevelUp = useCallback((newLevel: number, previousLevel: number, totalXp: number) => {
    analytics.trackLevelUp({ new_level: newLevel, previous_level: previousLevel, total_xp: totalXp })
  }, [])

  const trackAchievementUnlocked = useCallback((
    achievementId: string,
    achievementName: string,
    category?: string,
    xpEarned?: number
  ) => {
    analytics.trackAchievementUnlocked({
      achievement_id: achievementId,
      achievement_name: achievementName,
      achievement_category: category,
      xp_earned: xpEarned,
    })
  }, [])

  // Subscription events
  const trackSubscriptionStarted = useCallback((
    plan: 'free' | 'pro' | 'enterprise',
    billingCycle?: 'monthly' | 'yearly',
    price?: number,
    trial?: boolean
  ) => {
    analytics.trackSubscriptionStarted({ plan, billing_cycle: billingCycle, price, trial })
  }, [])

  const trackSubscriptionCancelled = useCallback((
    plan: 'free' | 'pro' | 'enterprise',
    reason?: string,
    daysActive?: number
  ) => {
    analytics.trackSubscriptionCancelled({ plan, reason, days_active: daysActive })
  }, [])

  // Discovery events
  const trackCourseEnrolled = useCallback((
    courseId: string,
    courseTitle?: string,
    enrollmentSource?: 'browse' | 'search' | 'recommendation' | 'path'
  ) => {
    analytics.trackCourseEnrolled({
      course_id: courseId,
      course_title: courseTitle,
      enrollment_source: enrollmentSource,
    })
  }, [])

  const trackSearchPerformed = useCallback((query: string, resultsCount: number, category?: string) => {
    analytics.trackSearchPerformed({ query, results_count: resultsCount, category })
  }, [])

  // Discussion events
  const trackDiscussionCreated = useCallback((
    contentLength: number,
    courseId?: string,
    lessonId?: string
  ) => {
    analytics.trackDiscussionCreated({
      course_id: courseId,
      lesson_id: lessonId,
      content_length: contentLength,
    })
  }, [])

  const trackReplyCreated = useCallback((discussionId: string, contentLength: number) => {
    analytics.trackReplyCreated({ discussion_id: discussionId, content_length: contentLength })
  }, [])

  // Error tracking
  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, unknown>) => {
    analytics.trackError(errorType, errorMessage, context)
  }, [])

  // User properties
  const setUserProperties = useCallback((properties: Record<string, unknown>) => {
    analytics.setUserProperties(properties)
  }, [])

  return {
    track,
    // User events
    trackSignUp,
    trackSignIn,
    trackSignOut,
    // Course events
    trackCourseStarted,
    trackLessonCompleted,
    trackQuizCompleted,
    trackAssessmentCompleted,
    trackProjectSubmitted,
    // Engagement events
    trackStreakAchieved,
    trackLevelUp,
    trackAchievementUnlocked,
    // Subscription events
    trackSubscriptionStarted,
    trackSubscriptionCancelled,
    // Discovery events
    trackCourseEnrolled,
    trackSearchPerformed,
    // Discussion events
    trackDiscussionCreated,
    trackReplyCreated,
    // Error tracking
    trackError,
    // User properties
    setUserProperties,
  }
}

/**
 * Hook for tracking time spent on a page or component
 *
 * @param eventName - The event name to track when unmounting
 * @param properties - Additional properties to include
 *
 * @example
 * ```tsx
 * function LessonPage({ lessonId }) {
 *   useTimeTracking('lesson_time_spent', { lessonId })
 *
 *   return <div>Lesson content...</div>
 * }
 * ```
 */
export function useTimeTracking(
  eventName: string,
  properties?: Record<string, unknown>
): { getTimeSpent: () => number } {
  const startTime = useRef(Date.now())
  const propsRef = useRef(properties)

  // Update properties ref when they change
  useEffect(() => {
    propsRef.current = properties
  }, [properties])

  // Track time on unmount
  useEffect(() => {
    // Copy ref value for use in cleanup function
    const currentStartTime = startTime.current
    const currentPropsRef = propsRef

    return () => {
      const timeSpentSeconds = Math.round((Date.now() - currentStartTime) / 1000)

      analytics.track(eventName, {
        ...currentPropsRef.current,
        time_spent_seconds: timeSpentSeconds,
      })
    }
  }, [eventName])

  const getTimeSpent = useCallback(() => {
    return Math.round((Date.now() - startTime.current) / 1000)
  }, [])

  return { getTimeSpent }
}

/**
 * Hook for tracking conversion funnels
 *
 * @param funnelName - Name of the funnel
 *
 * @example
 * ```tsx
 * function CheckoutFlow() {
 *   const { trackStep, trackComplete, trackAbandoned } = useFunnelTracking('checkout')
 *
 *   return (
 *     <Stepper
 *       onStepChange={(step) => trackStep(step)}
 *       onComplete={() => trackComplete()}
 *       onCancel={() => trackAbandoned(currentStep)}
 *     />
 *   )
 * }
 * ```
 */
export function useFunnelTracking(funnelName: string) {
  const startTime = useRef(Date.now())
  const stepsCompleted = useRef<string[]>([])

  const trackStep = useCallback((stepName: string, properties?: Record<string, unknown>) => {
    stepsCompleted.current.push(stepName)

    analytics.track(`${funnelName}_step`, {
      funnel_name: funnelName,
      step_name: stepName,
      step_number: stepsCompleted.current.length,
      time_since_start_seconds: Math.round((Date.now() - startTime.current) / 1000),
      ...properties,
    })
  }, [funnelName])

  const trackComplete = useCallback((properties?: Record<string, unknown>) => {
    analytics.track(`${funnelName}_completed`, {
      funnel_name: funnelName,
      total_steps: stepsCompleted.current.length,
      steps_completed: stepsCompleted.current,
      total_time_seconds: Math.round((Date.now() - startTime.current) / 1000),
      ...properties,
    })
  }, [funnelName])

  const trackAbandoned = useCallback((lastStep: string, reason?: string) => {
    analytics.track(`${funnelName}_abandoned`, {
      funnel_name: funnelName,
      last_step: lastStep,
      steps_completed: stepsCompleted.current,
      total_time_seconds: Math.round((Date.now() - startTime.current) / 1000),
      reason,
    })
  }, [funnelName])

  return { trackStep, trackComplete, trackAbandoned }
}
