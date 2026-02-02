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
