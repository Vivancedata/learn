/**
 * Validation schemas using Zod
 * These schemas validate user input for API endpoints and forms
 */

import { z } from 'zod'

// ============================================================================
// Sanitization Utilities
// ============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML entities in user-provided strings
 */
export function sanitizeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Create a Zod string schema with HTML sanitization
 */
export function sanitizedString() {
  return z.string().transform(sanitizeHtml)
}

// ============================================================================
// User & Authentication Schemas
// ============================================================================

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  githubUsername: z.string().max(39, 'GitHub username too long').optional(),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateUserSettingsSchema = z.object({
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  githubUsername: z.string().max(39, 'GitHub username too long').optional(),
})

// ============================================================================
// Submission Schemas
// ============================================================================

// GitHub URL regex pattern
const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+/

export const createSubmissionSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID format'),
  githubUrl: z
    .string()
    .url('Invalid URL format')
    .regex(githubUrlPattern, 'Must be a valid GitHub repository URL')
    .transform(sanitizeHtml),
  liveUrl: z.string().url('Invalid URL format').optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').transform(sanitizeHtml).optional(),
})

// ============================================================================
// Course & Learning Schemas
// ============================================================================

export const courseIdSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
})

export const lessonIdSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID format'),
})

export const courseAndLessonSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().uuid('Invalid lesson ID format'),
})

// ============================================================================
// Progress Tracking Schemas
// ============================================================================

export const markLessonCompleteSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().uuid('Invalid lesson ID'),
})

export const submitQuizSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  courseId: z.string().min(1, 'Course ID is required'),
  lessonId: z.string().uuid('Invalid lesson ID'),
  answers: z.array(z.number().int().min(0)).min(1, 'Answers are required'),
})

// ============================================================================
// Project Submission Schemas
// ============================================================================

const githubUrlRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/

export const projectSubmissionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  lessonId: z.string().uuid('Invalid lesson ID'),
  githubUrl: z
    .string()
    .url('Invalid URL format')
    .regex(githubUrlRegex, 'Must be a valid GitHub repository URL'),
  liveUrl: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .transform(sanitizeHtml)
    .optional(),
})

export const reviewProjectSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  status: z.enum(['approved', 'rejected']),
  feedback: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(2000, 'Feedback must be less than 2000 characters')
    .transform(sanitizeHtml),
  reviewedBy: z.string().uuid('Invalid reviewer ID'),
})

// ============================================================================
// Discussion Schemas
// ============================================================================

export const createDiscussionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  content: z
    .string()
    .min(10, 'Discussion must be at least 10 characters')
    .max(5000, 'Discussion must be less than 5000 characters')
    .transform(sanitizeHtml),
  courseId: z.string().min(1).optional(),
  lessonId: z.string().uuid().optional(),
}).refine(
  (data) => data.courseId || data.lessonId,
  {
    message: 'Either courseId or lessonId must be provided',
  }
)

export const createReplySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  discussionId: z.string().uuid('Invalid discussion ID'),
  content: z
    .string()
    .min(1, 'Reply cannot be empty')
    .max(2000, 'Reply must be less than 2000 characters')
    .transform(sanitizeHtml),
})

export const updateDiscussionLikesSchema = z.object({
  discussionId: z.string().uuid('Invalid discussion ID'),
  increment: z.boolean(),
})

export const updateDiscussionSchema = z.object({
  content: z
    .string()
    .min(10, 'Discussion must be at least 10 characters')
    .max(5000, 'Discussion must be less than 5000 characters')
    .transform(sanitizeHtml),
})

// ============================================================================
// Project Update Schema
// ============================================================================

export const updateProjectSchema = z.object({
  githubUrl: z
    .string()
    .url('Invalid URL format')
    .regex(/^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/, 'Must be a valid GitHub repository URL')
    .optional(),
  liveUrl: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal(''))
    .nullable(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
  isPublic: z.boolean().optional(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
})

// ============================================================================
// Student Solutions Gallery Schemas
// ============================================================================

export const getSolutionsQuerySchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID format'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 12))
    .pipe(z.number().int().min(1).max(50, 'Limit must be between 1 and 50')),
})

export const toggleSolutionLikeSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
})

// ============================================================================
// Community Points Schemas
// ============================================================================

export const givePointSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient user ID'),
  discussionId: z.string().uuid('Invalid discussion ID').optional(),
  replyId: z.string().uuid('Invalid reply ID').optional(),
  reason: z
    .string()
    .max(200, 'Reason must be less than 200 characters')
    .transform(sanitizeHtml)
    .optional(),
}).refine(
  (data) => data.discussionId || data.replyId,
  {
    message: 'Either discussionId or replyId must be provided',
  }
).refine(
  (data) => !(data.discussionId && data.replyId),
  {
    message: 'Cannot provide both discussionId and replyId',
  }
)

export const userPointsParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

// ============================================================================
// Daily Streak Schemas
// ============================================================================

export const recordActivitySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  xpEarned: z.number().int().min(0).optional().default(0),
  lessonsCompleted: z.number().int().min(0).optional().default(0),
  quizzesTaken: z.number().int().min(0).optional().default(0),
  timeSpentMinutes: z.number().int().min(0).optional().default(0),
})

export const useStreakFreezeSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const streakUserParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

// ============================================================================
// Pagination Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100, 'Limit must be between 1 and 100')),
})

// ============================================================================
// Push Notification Schemas
// ============================================================================

export const pushSubscriptionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  subscription: z.object({
    endpoint: z.string().url('Invalid endpoint URL'),
    keys: z.object({
      p256dh: z.string().min(1, 'P256dh key is required'),
      auth: z.string().min(1, 'Auth key is required'),
    }),
  }),
})

export const unsubscribePushSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  endpoint: z.string().url('Invalid endpoint URL'),
})

export const notificationPreferencesSchema = z.object({
  streakReminders: z.boolean().optional(),
  courseUpdates: z.boolean().optional(),
  achievementAlerts: z.boolean().optional(),
  weeklyProgress: z.boolean().optional(),
  communityReplies: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
})

export const sendNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .transform(sanitizeHtml),
  body: z
    .string()
    .min(1, 'Body is required')
    .max(500, 'Body must be less than 500 characters')
    .transform(sanitizeHtml),
  url: z.string().url('Invalid URL').optional(),
  icon: z.string().optional(),
  tag: z.string().optional(),
  requireInteraction: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
})

// ============================================================================
// Recommendation Schemas
// ============================================================================

export const userIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const dismissRecommendationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  courseId: z.string().min(1, 'Course ID is required'),
})

export const clickRecommendationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  courseId: z.string().min(1, 'Course ID is required'),
})

export const refreshRecommendationsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

// ============================================================================
// Leaderboard Schemas
// ============================================================================

export const leaderboardTypeValues = ['xp', 'streaks', 'courses', 'lessons', 'helping'] as const
export const leaderboardPeriodValues = ['daily', 'weekly', 'monthly', 'all_time'] as const

export const getLeaderboardSchema = z.object({
  type: z.enum(leaderboardTypeValues).default('xp'),
  period: z.enum(leaderboardPeriodValues).default('all_time'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100, 'Limit must be between 1 and 100')),
})

export const leaderboardUserParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const refreshLeaderboardSchema = z.object({
  type: z.enum(leaderboardTypeValues).optional(),
  period: z.enum(leaderboardPeriodValues).optional(),
})

// ============================================================================
// Video Progress Schemas
// ============================================================================

export const videoProgressSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
  watchedSeconds: z.number().int().min(0, 'Watched seconds must be non-negative'),
  totalSeconds: z.number().int().min(1, 'Total seconds must be at least 1'),
  completed: z.boolean().optional().default(false),
})

export const getVideoProgressSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
})

export const videoProgressParamsSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
})

// ============================================================================
// XP (Experience Points) Schemas
// ============================================================================

export const xpSourceValues = [
  'LESSON_COMPLETE',
  'QUIZ_PERFECT',
  'QUIZ_PASS',
  'PROJECT_SUBMIT',
  'PROJECT_APPROVED',
  'STREAK_BONUS',
  'ACHIEVEMENT',
  'DAILY_LOGIN',
  'HELPING_OTHERS',
] as const

export const xpUserParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const awardXpSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().int().min(1, 'Amount must be at least 1').max(10000, 'Amount too large'),
  source: z.enum(xpSourceValues),
  sourceId: z.string().optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters')
    .transform(sanitizeHtml),
})

export const xpHistoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(100, 'Limit must be between 1 and 100')),
  source: z.enum(xpSourceValues).optional(),
})

// ============================================================================
// Skill Assessment Schemas
// ============================================================================

export const questionTypeValues = [
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'CODE_OUTPUT',
  'FILL_BLANK',
] as const

export const difficultyValues = ['Beginner', 'Intermediate', 'Advanced'] as const

export const assessmentSlugParamsSchema = z.object({
  slug: z.string().min(1, 'Assessment slug is required'),
})

export const getAssessmentsQuerySchema = z.object({
  skillArea: z.string().optional(),
  difficulty: z.enum(difficultyValues).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(50, 'Limit must be between 1 and 50')),
})

export const startAssessmentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const submitAssessmentSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID'),
  userId: z.string().uuid('Invalid user ID'),
  timeSpent: z.number().int().min(0, 'Time spent must be non-negative').optional(),
  answers: z.record(
    z.string(),
    z.union([
      z.string(),
      z.array(z.string()),
      z.number(),
    ])
  ).refine(
    (answers) => Object.keys(answers).length > 0,
    { message: 'Answers are required' }
  ),
})

export const getUserAssessmentsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

export const assessmentUserParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CourseIdInput = z.infer<typeof courseIdSchema>
export type LessonIdInput = z.infer<typeof lessonIdSchema>
export type CourseAndLessonInput = z.infer<typeof courseAndLessonSchema>
export type MarkLessonCompleteInput = z.infer<typeof markLessonCompleteSchema>
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>
export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>
export type ReviewProjectInput = z.infer<typeof reviewProjectSchema>
export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>
export type CreateReplyInput = z.infer<typeof createReplySchema>
export type UpdateDiscussionLikesInput = z.infer<typeof updateDiscussionLikesSchema>
export type UpdateDiscussionInput = z.infer<typeof updateDiscussionSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type GetSolutionsQueryInput = z.infer<typeof getSolutionsQuerySchema>
export type ToggleSolutionLikeInput = z.infer<typeof toggleSolutionLikeSchema>
export type GivePointInput = z.infer<typeof givePointSchema>
export type UserPointsParamsInput = z.infer<typeof userPointsParamsSchema>
export type RecordActivityInput = z.infer<typeof recordActivitySchema>
export type UseStreakFreezeInput = z.infer<typeof useStreakFreezeSchema>
export type StreakUserParamsInput = z.infer<typeof streakUserParamsSchema>
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>
export type DismissRecommendationInput = z.infer<typeof dismissRecommendationSchema>
export type ClickRecommendationInput = z.infer<typeof clickRecommendationSchema>
export type RefreshRecommendationsInput = z.infer<typeof refreshRecommendationsSchema>
export type GetLeaderboardInput = z.infer<typeof getLeaderboardSchema>
export type LeaderboardUserParamsInput = z.infer<typeof leaderboardUserParamsSchema>
export type RefreshLeaderboardInput = z.infer<typeof refreshLeaderboardSchema>
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>
export type UnsubscribePushInput = z.infer<typeof unsubscribePushSchema>
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>
export type VideoProgressInput = z.infer<typeof videoProgressSchema>
export type GetVideoProgressInput = z.infer<typeof getVideoProgressSchema>
export type VideoProgressParamsInput = z.infer<typeof videoProgressParamsSchema>
export type XpUserParamsInput = z.infer<typeof xpUserParamsSchema>
export type AwardXpInput = z.infer<typeof awardXpSchema>
export type XpHistoryQueryInput = z.infer<typeof xpHistoryQuerySchema>
export type AssessmentSlugParamsInput = z.infer<typeof assessmentSlugParamsSchema>
export type GetAssessmentsQueryInput = z.infer<typeof getAssessmentsQuerySchema>
export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>
export type GetUserAssessmentsInput = z.infer<typeof getUserAssessmentsSchema>
export type AssessmentUserParamsInput = z.infer<typeof assessmentUserParamsSchema>

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates data against a Zod schema and returns typed result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with typed data or errors
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

/**
 * Formats Zod validation errors into a user-friendly object
 * @param error - Zod error object
 * @returns Object mapping field names to error messages
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  error.issues.forEach((err) => {
    const path = err.path.length > 0 ? err.path.join('.') : 'root'
    errors[path] = err.message
  })

  return errors
}

/**
 * Validates request body against a Zod schema
 * Returns a result object compatible with legacy API patterns
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with typed data or error string
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error)
      const errorMessage = Object.entries(formattedErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ')
      return { success: false, error: errorMessage || 'Validation failed' }
    }
    throw error
  }
}

// ============================================================================
// Stripe Payment Schemas
// ============================================================================

export const subscriptionStatusValues = [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'incomplete_expired',
  'unpaid',
] as const

export const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
})

export const createPortalSessionSchema = z.object({
  returnUrl: z.string().url('Invalid return URL').optional(),
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>
export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>

// ============================================================================
// AI Tutor Schemas
// ============================================================================

export const tutorContextSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID').optional(),
  lessonTitle: z.string().max(200, 'Lesson title too long').optional(),
  courseId: z.string().max(100, 'Course ID too long').optional(),
  courseName: z.string().max(200, 'Course name too long').optional(),
  currentContent: z.string().max(10000, 'Content too long').optional(),
})

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message must be less than 4000 characters')
    .transform(sanitizeHtml),
  conversationId: z.string().uuid('Invalid conversation ID').optional(),
  context: tutorContextSchema.optional(),
})

export const createConversationSchema = z.object({
  context: tutorContextSchema.optional(),
})

export const getConversationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(50, 'Limit must be between 1 and 50')),
})

export const conversationIdParamsSchema = z.object({
  id: z.string().uuid('Invalid conversation ID'),
})

export type TutorContextInput = z.infer<typeof tutorContextSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type GetConversationsQueryInput = z.infer<typeof getConversationsQuerySchema>
export type ConversationIdParamsInput = z.infer<typeof conversationIdParamsSchema>
