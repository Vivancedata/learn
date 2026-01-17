import { z } from 'zod'
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  apiSuccess,
  apiError,
  handleApiError,
  HTTP_STATUS,
} from '../api-errors'

describe('API Error Utilities', () => {
  describe('Error Classes', () => {
    describe('ApiError', () => {
      it('should create error with correct properties', () => {
        const error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'Test error', { field: 'value' })

        expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST)
        expect(error.message).toBe('Test error')
        expect(error.details).toEqual({ field: 'value' })
        expect(error.name).toBe('ApiError')
      })
    })

    describe('ValidationError', () => {
      it('should create 400 error', () => {
        const error = new ValidationError('Invalid data', { field: 'error' })

        expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST)
        expect(error.message).toBe('Invalid data')
        expect(error.details).toEqual({ field: 'error' })
        expect(error.name).toBe('ValidationError')
      })
    })

    describe('NotFoundError', () => {
      it('should create 404 error with resource name', () => {
        const error = new NotFoundError('User')

        expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND)
        expect(error.message).toBe('User not found')
        expect(error.name).toBe('NotFoundError')
      })
    })

    describe('UnauthorizedError', () => {
      it('should create 401 error with default message', () => {
        const error = new UnauthorizedError()

        expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED)
        expect(error.message).toBe('Unauthorized access')
        expect(error.name).toBe('UnauthorizedError')
      })

      it('should create 401 error with custom message', () => {
        const error = new UnauthorizedError('Token expired')

        expect(error.message).toBe('Token expired')
      })
    })

    describe('ForbiddenError', () => {
      it('should create 403 error with default message', () => {
        const error = new ForbiddenError()

        expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
        expect(error.message).toBe('Access forbidden')
        expect(error.name).toBe('ForbiddenError')
      })

      it('should create 403 error with custom message', () => {
        const error = new ForbiddenError('Admin access required')

        expect(error.message).toBe('Admin access required')
      })
    })
  })

  describe('Response Builders', () => {
    describe('apiSuccess', () => {
      it('should create success response with default status', async () => {
        const data = { id: 1, name: 'Test' }
        const response = apiSuccess(data)

        expect(response.status).toBe(HTTP_STATUS.OK)

        const body = await response.json()
        expect(body.data).toEqual(data)
        expect(body.timestamp).toBeDefined()
      })

      it('should create success response with custom status', async () => {
        const data = { id: 1 }
        const response = apiSuccess(data, HTTP_STATUS.CREATED)

        expect(response.status).toBe(HTTP_STATUS.CREATED)
      })
    })

    describe('apiError', () => {
      it('should create error response', async () => {
        const response = apiError('Something went wrong', HTTP_STATUS.BAD_REQUEST)

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)

        const body = await response.json()
        expect(body.message).toBe('Something went wrong')
        expect(body.error).toBe('Bad Request')
        expect(body.timestamp).toBeDefined()
      })

      it('should handle Error object', async () => {
        const error = new Error('Test error message')
        const response = apiError(error, HTTP_STATUS.INTERNAL_SERVER_ERROR)

        const body = await response.json()
        expect(body.message).toBe('Test error message')
      })
    })
  })

  describe('handleApiError', () => {
    it('should handle ValidationError', async () => {
      const error = new ValidationError('Invalid input', { field: 'error' })
      const response = handleApiError(error)

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)

      const body = await response.json()
      expect(body.message).toBe('Invalid input')
    })

    it('should handle NotFoundError', async () => {
      const error = new NotFoundError('Resource')
      const response = handleApiError(error)

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND)

      const body = await response.json()
      expect(body.message).toBe('Resource not found')
    })

    it('should handle UnauthorizedError', async () => {
      const error = new UnauthorizedError('Please login')
      const response = handleApiError(error)

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED)

      const body = await response.json()
      expect(body.message).toBe('Please login')
    })

    it('should handle ForbiddenError', async () => {
      const error = new ForbiddenError('No access')
      const response = handleApiError(error)

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN)

      const body = await response.json()
      expect(body.message).toBe('No access')
    })

    it('should handle Zod validation error', async () => {
      const schema = z.object({ name: z.string().min(1) })
      let zodError: z.ZodError | null = null

      try {
        schema.parse({ name: '' })
      } catch (error) {
        if (error instanceof z.ZodError) {
          zodError = error
        }
      }

      expect(zodError).not.toBeNull()

      const response = handleApiError(zodError!)
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)

      const body = await response.json()
      expect(body.message).toBe('Validation failed')
    })

    it('should handle Prisma P2002 (unique constraint) error', async () => {
      const prismaError = { code: 'P2002', meta: { target: ['email'] } }
      const response = handleApiError(prismaError)

      expect(response.status).toBe(HTTP_STATUS.CONFLICT)

      const body = await response.json()
      expect(body.message).toContain('already exists')
    })

    it('should handle Prisma P2025 (not found) error', async () => {
      const prismaError = { code: 'P2025', meta: {} }
      const response = handleApiError(prismaError)

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND)

      const body = await response.json()
      expect(body.message).toContain('not found')
    })

    it('should handle Prisma P2003 (foreign key) error', async () => {
      const prismaError = { code: 'P2003', meta: {} }
      const response = handleApiError(prismaError)

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST)

      const body = await response.json()
      expect(body.message).toContain('Invalid reference')
    })

    it('should handle generic Error', async () => {
      const error = new Error('Something went wrong')
      const response = handleApiError(error)

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const body = await response.json()
      expect(body.message).toBe('Something went wrong')
    })

    it('should handle unknown error type', async () => {
      const error = 'Just a string'
      const response = handleApiError(error)

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)

      const body = await response.json()
      expect(body.message).toBe('An unexpected error occurred')
    })
  })
})
