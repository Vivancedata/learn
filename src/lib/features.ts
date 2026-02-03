/**
 * Feature Gating Configuration
 * Defines what features are available on each subscription plan
 */

// ============================================================================
// Types
// ============================================================================

export type PlanType = 'free' | 'pro'

export interface UserFeatureContext {
  plan: PlanType
  isPro: boolean
  coursesStarted?: number
}

// ============================================================================
// Plan Limits
// ============================================================================

export const PLAN_LIMITS = {
  FREE: {
    maxCourses: 3,
    maxPaths: 1,
    canAccessAssessments: false,
    canAccessCertificates: false,
    canAccessProjectFeedback: false,
    canAccessOfflineMode: false,
    canAccessEarlyAccess: false,
    canAccessPrioritySupport: false,
  },
  PRO: {
    maxCourses: Infinity,
    maxPaths: Infinity,
    canAccessAssessments: true,
    canAccessCertificates: true,
    canAccessProjectFeedback: true,
    canAccessOfflineMode: true,
    canAccessEarlyAccess: true,
    canAccessPrioritySupport: true,
  },
} as const

// ============================================================================
// Feature Check Functions
// ============================================================================

/**
 * Check if user can access skill assessments
 * Assessments are Pro-only
 */
export function canAccessAssessments(user: UserFeatureContext): boolean {
  return user.isPro
}

/**
 * Check if user can access/generate certificates
 * Certificates are Pro-only
 */
export function canAccessCertificates(user: UserFeatureContext): boolean {
  return user.isPro
}

/**
 * Check if user can access expert project feedback
 * Expert feedback is Pro-only
 */
export function canAccessProjectFeedback(user: UserFeatureContext): boolean {
  return user.isPro
}

/**
 * Check if user can access offline mode
 * Offline mode is Pro-only
 */
export function canAccessOfflineMode(user: UserFeatureContext): boolean {
  return user.isPro
}

/**
 * Check if user can access early access content
 * Early access is Pro-only
 */
export function canAccessEarlyAccess(user: UserFeatureContext): boolean {
  return user.isPro
}

/**
 * Check if user has priority support
 * Priority support is Pro-only
 */
export function hasPrioritySupport(user: UserFeatureContext): boolean {
  return user.isPro
}

/**
 * Get the maximum number of courses allowed for the plan
 */
export function getMaxCoursesAllowed(user: UserFeatureContext): number {
  return user.isPro ? PLAN_LIMITS.PRO.maxCourses : PLAN_LIMITS.FREE.maxCourses
}

/**
 * Get the maximum number of learning paths allowed for the plan
 */
export function getMaxPathsAllowed(user: UserFeatureContext): number {
  return user.isPro ? PLAN_LIMITS.PRO.maxPaths : PLAN_LIMITS.FREE.maxPaths
}

/**
 * Check if user can start a new course
 * Free users are limited to 3 courses
 */
export function canStartNewCourse(user: UserFeatureContext): boolean {
  if (user.isPro) return true
  const coursesStarted = user.coursesStarted ?? 0
  return coursesStarted < PLAN_LIMITS.FREE.maxCourses
}

/**
 * Check if user has reached their course limit
 */
export function hasReachedCourseLimit(user: UserFeatureContext): boolean {
  if (user.isPro) return false
  const coursesStarted = user.coursesStarted ?? 0
  return coursesStarted >= PLAN_LIMITS.FREE.maxCourses
}

/**
 * Get remaining course slots for free users
 */
export function getRemainingCourseSlots(user: UserFeatureContext): number {
  if (user.isPro) return Infinity
  const coursesStarted = user.coursesStarted ?? 0
  return Math.max(0, PLAN_LIMITS.FREE.maxCourses - coursesStarted)
}

// ============================================================================
// Feature Names and Descriptions
// ============================================================================

export const PRO_FEATURES = [
  {
    id: 'unlimited-courses',
    name: 'Unlimited Course Access',
    description: 'Access all courses without any limits',
    icon: 'book',
  },
  {
    id: 'assessments',
    name: 'Skill Assessments',
    description: 'Test your knowledge with comprehensive assessments',
    icon: 'clipboard-check',
  },
  {
    id: 'certificates',
    name: 'Verified Certificates',
    description: 'Earn certificates to showcase your achievements',
    icon: 'award',
  },
  {
    id: 'project-feedback',
    name: 'Expert Project Feedback',
    description: 'Get personalized feedback from industry experts',
    icon: 'message-square',
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: 'Get faster responses from our support team',
    icon: 'headphones',
  },
  {
    id: 'offline-access',
    name: 'Offline Access',
    description: 'Download lessons to learn anywhere',
    icon: 'download',
  },
  {
    id: 'early-access',
    name: 'Early Access',
    description: 'Be the first to access new courses and features',
    icon: 'zap',
  },
] as const

/**
 * Get the description for why a feature requires Pro
 */
export function getProFeatureDescription(featureId: string): string {
  const feature = PRO_FEATURES.find(f => f.id === featureId)
  return feature?.description || 'This feature requires a Pro subscription'
}
