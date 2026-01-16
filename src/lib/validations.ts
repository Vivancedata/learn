import { z } from 'zod'

/**
 * Validation schemas for API request bodies
 * Using Zod for type-safe, runtime validation
 */

// Discussion schemas
export const createDiscussionSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be 5000 characters or less')
    .transform(s => s.trim()),
  courseId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
}).refine(
  data => data.courseId || data.lessonId,
  { message: 'Either courseId or lessonId is required' }
)

export const updateDiscussionSchema = z.object({
  content: z
    .string()
    .min(1, 'Content must be non-empty')
    .max(5000, 'Content must be 5000 characters or less')
    .transform(s => s.trim())
    .optional(),
  like: z.boolean().optional(),
}).refine(
  data => data.content !== undefined || data.like !== undefined,
  { message: 'No valid action provided' }
)

export const createReplySchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be 5000 characters or less')
    .transform(s => s.trim()),
})

// Submission schemas
const githubUrlSchema = z.string().refine(
  url => {
    try {
      const parsed = new URL(url)
      return parsed.hostname === 'github.com' || parsed.hostname.endsWith('.github.com')
    } catch {
      return false
    }
  },
  { message: 'Please provide a valid GitHub URL' }
)

export const createSubmissionSchema = z.object({
  lessonId: z.string().min(1, 'lessonId is required'),
  githubUrl: githubUrlSchema,
  liveUrl: z.string().url('Please provide a valid URL').optional().nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional().nullable(),
})

export const updateSubmissionSchema = z.object({
  githubUrl: githubUrlSchema.optional(),
  liveUrl: z.string().url('Please provide a valid URL').optional().nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional().nullable(),
})

// User settings schemas
const emailSchema = z.string().email('Invalid email address')

export const updateUserSettingsSchema = z.object({
  name: z.string().max(100, 'Name must be 100 characters or less').optional().nullable(),
  email: emailSchema.optional(),
  githubUsername: z
    .string()
    .max(39, 'GitHub username must be 39 characters or less')
    .regex(/^[a-zA-Z0-9-]*$/, 'GitHub username can only contain letters, numbers, and hyphens')
    .optional()
    .nullable(),
})

// Progress schemas
export const markLessonCompleteSchema = z.object({
  quizScore: z.number().min(0).max(100).optional(),
})

// Type exports for use in route handlers
export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>
export type UpdateDiscussionInput = z.infer<typeof updateDiscussionSchema>
export type CreateReplyInput = z.infer<typeof createReplySchema>
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>

/**
 * Helper function to validate request body and return formatted error
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const firstError = result.error.errors[0]
    return {
      success: false,
      error: firstError?.message || 'Validation failed',
    }
  }
  return { success: true, data: result.data }
}
