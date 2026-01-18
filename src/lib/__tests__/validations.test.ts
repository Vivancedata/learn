import { z } from 'zod'
import {
  signUpSchema,
  signInSchema,
  sanitizeHtml,
  sanitizedString,
  createDiscussionSchema,
  createReplySchema,
  markLessonCompleteSchema,
  submitQuizSchema,
  paginationSchema,
  validate,
  formatZodErrors,
  validateBody,
} from '../validations'

describe('Validation Schemas', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>'
      const sanitized = sanitizeHtml(input)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('&lt;script&gt;')
    })

    it('should escape quotes', () => {
      const input = 'Test "quoted" and \'single\' quotes'
      const sanitized = sanitizeHtml(input)

      expect(sanitized).not.toContain('"')
      expect(sanitized).not.toContain("'")
      expect(sanitized).toContain('&quot;')
      expect(sanitized).toContain('&#x27;')
    })

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry'
      const sanitized = sanitizeHtml(input)

      expect(sanitized).toBe('Tom &amp; Jerry')
    })

    it('should handle empty string', () => {
      expect(sanitizeHtml('')).toBe('')
    })

    it('should handle string with no special characters', () => {
      const input = 'Hello World 123'
      expect(sanitizeHtml(input)).toBe(input)
    })
  })

  describe('signUpSchema', () => {
    it('should validate a valid signup', () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User',
      }

      const result = signUpSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'ValidPass123',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject password without uppercase', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'invalidpass123',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject password without lowercase', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'INVALIDPASS123',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'InvalidPass',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Pass1',
      }

      const result = signUpSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('signInSchema', () => {
    it('should validate a valid signin', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      }

      const result = signInSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      }

      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createDiscussionSchema', () => {
    const validUserId = '123e4567-e89b-12d3-a456-426614174000'

    it('should validate with courseId', () => {
      const validData = {
        userId: validUserId,
        content: 'This is a valid discussion post',
        courseId: 'course-1',
      }

      const result = createDiscussionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate with lessonId', () => {
      const validData = {
        userId: validUserId,
        content: 'This is a valid discussion post',
        lessonId: validUserId,
      }

      const result = createDiscussionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject without courseId or lessonId', () => {
      const invalidData = {
        userId: validUserId,
        content: 'This is a valid discussion post',
      }

      const result = createDiscussionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject content shorter than 10 characters', () => {
      const invalidData = {
        userId: validUserId,
        content: 'Short',
        courseId: 'course-1',
      }

      const result = createDiscussionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should sanitize HTML in content', () => {
      const dataWithHtml = {
        userId: validUserId,
        content: '<script>alert("xss")</script>Hello World',
        courseId: 'course-1',
      }

      const result = createDiscussionSchema.safeParse(dataWithHtml)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.content).not.toContain('<script>')
        expect(result.data.content).toContain('&lt;script&gt;')
      }
    })
  })

  describe('createReplySchema', () => {
    const validUserId = '123e4567-e89b-12d3-a456-426614174000'
    const validDiscussionId = '123e4567-e89b-12d3-a456-426614174001'

    it('should validate a valid reply', () => {
      const validData = {
        userId: validUserId,
        discussionId: validDiscussionId,
        content: 'This is a reply',
      }

      const result = createReplySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty content', () => {
      const invalidData = {
        userId: validUserId,
        discussionId: validDiscussionId,
        content: '',
      }

      const result = createReplySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should sanitize HTML in reply content', () => {
      const dataWithHtml = {
        userId: validUserId,
        discussionId: validDiscussionId,
        content: '<img src=x onerror=alert(1)>Test reply',
      }

      const result = createReplySchema.safeParse(dataWithHtml)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.content).not.toContain('<img')
        expect(result.data.content).toContain('&lt;img')
      }
    })
  })

  describe('markLessonCompleteSchema', () => {
    const validUserId = '123e4567-e89b-12d3-a456-426614174000'
    const validLessonId = '123e4567-e89b-12d3-a456-426614174001'

    it('should validate valid data', () => {
      const validData = {
        userId: validUserId,
        courseId: 'course-1',
        lessonId: validLessonId,
      }

      const result = markLessonCompleteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid userId format', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        courseId: 'course-1',
        lessonId: validLessonId,
      }

      const result = markLessonCompleteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid lessonId format', () => {
      const invalidData = {
        userId: validUserId,
        courseId: 'course-1',
        lessonId: 'not-a-uuid',
      }

      const result = markLessonCompleteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('submitQuizSchema', () => {
    const validUserId = '123e4567-e89b-12d3-a456-426614174000'
    const validLessonId = '123e4567-e89b-12d3-a456-426614174001'

    it('should validate valid quiz submission', () => {
      const validData = {
        userId: validUserId,
        courseId: 'course-1',
        lessonId: validLessonId,
        answers: [0, 1, 2, 3],
      }

      const result = submitQuizSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty answers array', () => {
      const invalidData = {
        userId: validUserId,
        courseId: 'course-1',
        lessonId: validLessonId,
        answers: [],
      }

      const result = submitQuizSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative answer indices', () => {
      const invalidData = {
        userId: validUserId,
        courseId: 'course-1',
        lessonId: validLessonId,
        answers: [-1, 0, 1],
      }

      const result = submitQuizSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('sanitizedString', () => {
    it('should create a Zod string schema that sanitizes HTML', () => {
      const schema = sanitizedString()
      const result = schema.safeParse('<script>alert("xss")</script>')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toContain('&lt;script&gt;')
        expect(result.data).not.toContain('<script>')
      }
    })

    it('should pass through normal strings', () => {
      const schema = sanitizedString()
      const result = schema.safeParse('Hello World')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('Hello World')
      }
    })
  })

  describe('paginationSchema', () => {
    it('should parse valid page and limit', () => {
      const result = paginationSchema.safeParse({ page: '2', limit: '20' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should use defaults when not provided', () => {
      const result = paginationSchema.safeParse({})

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
      }
    })

    it('should reject page less than 1', () => {
      const result = paginationSchema.safeParse({ page: '0', limit: '10' })

      expect(result.success).toBe(false)
    })

    it('should reject limit greater than 100', () => {
      const result = paginationSchema.safeParse({ page: '1', limit: '101' })

      expect(result.success).toBe(false)
    })

    it('should handle undefined values', () => {
      const result = paginationSchema.safeParse({ page: undefined, limit: undefined })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
      }
    })
  })

  describe('validate', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    })

    it('should return success with data for valid input', () => {
      const validData = { name: 'John', age: 25 }
      const result = validate(testSchema, validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should return failure with errors for invalid input', () => {
      const invalidData = { name: '', age: -5 }
      const result = validate(testSchema, invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeInstanceOf(z.ZodError)
      }
    })

    it('should rethrow non-Zod errors', () => {
      const throwingSchema = z.string().transform(() => {
        throw new Error('Custom error')
      })

      expect(() => validate(throwingSchema, 'test')).toThrow('Custom error')
    })
  })

  describe('formatZodErrors', () => {
    it('should format Zod errors into a record', () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        password: z.string().min(8, 'Too short'),
      })

      const result = schema.safeParse({ email: 'not-email', password: '123' })

      expect(result.success).toBe(false)
      if (!result.success) {
        const formatted = formatZodErrors(result.error)
        expect(formatted.email).toBe('Invalid email')
        expect(formatted.password).toBe('Too short')
      }
    })

    it('should handle nested paths', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email('Invalid email'),
        }),
      })

      const result = schema.safeParse({ user: { email: 'bad' } })

      expect(result.success).toBe(false)
      if (!result.success) {
        const formatted = formatZodErrors(result.error)
        expect(formatted['user.email']).toBe('Invalid email')
      }
    })

    it('should use "root" for empty path', () => {
      const schema = z.string().min(1, 'Required')

      const result = schema.safeParse('')

      expect(result.success).toBe(false)
      if (!result.success) {
        const formatted = formatZodErrors(result.error)
        expect(formatted.root).toBe('Required')
      }
    })
  })

  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name required'),
      email: z.string().email('Invalid email'),
    })

    it('should return success with data for valid input', () => {
      const validData = { name: 'John', email: 'john@example.com' }
      const result = validateBody(testSchema, validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should return failure with formatted error string', () => {
      const invalidData = { name: '', email: 'not-email' }
      const result = validateBody(testSchema, invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Name required')
        expect(result.error).toContain('Invalid email')
      }
    })

    it('should rethrow non-Zod errors', () => {
      const throwingSchema = z.string().transform(() => {
        throw new Error('Custom validation error')
      })

      expect(() => validateBody(throwingSchema, 'test')).toThrow('Custom validation error')
    })
  })
})
