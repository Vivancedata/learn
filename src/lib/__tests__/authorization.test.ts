import { NextRequest } from 'next/server'
import {
  getAuthenticatedUserId,
  ensureOwnership,
  canAccessResource,
  requireOwnership,
} from '../authorization'
import { ApiError, HTTP_STATUS } from '../api-errors'

describe('Authorization Utilities', () => {
  describe('getAuthenticatedUserId', () => {
    it('should return user ID from request headers', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-user-id': userId,
        },
      })

      const result = getAuthenticatedUserId(request)
      expect(result).toBe(userId)
    })

    it('should throw UnauthorizedError when user ID is missing', () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      expect(() => getAuthenticatedUserId(request)).toThrow(ApiError)
      expect(() => getAuthenticatedUserId(request)).toThrow('Authentication required')
    })
  })

  describe('ensureOwnership', () => {
    it('should not throw when user IDs match', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      expect(() => ensureOwnership(userId, userId, 'resource')).not.toThrow()
    })

    it('should throw ForbiddenError when user IDs do not match', () => {
      const authenticatedUserId = '123e4567-e89b-12d3-a456-426614174000'
      const resourceOwnerId = '123e4567-e89b-12d3-a456-426614174001'

      expect(() => ensureOwnership(authenticatedUserId, resourceOwnerId, 'resource')).toThrow(
        ApiError
      )
    })

    it('should include resource name in error message', () => {
      const authenticatedUserId = '123e4567-e89b-12d3-a456-426614174000'
      const resourceOwnerId = '123e4567-e89b-12d3-a456-426614174001'

      try {
        ensureOwnership(authenticatedUserId, resourceOwnerId, 'test-resource')
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toContain('test-resource')
        expect((error as ApiError).statusCode).toBe(HTTP_STATUS.FORBIDDEN)
      }
    })

    it('should use default resource name when not provided', () => {
      const authenticatedUserId = '123e4567-e89b-12d3-a456-426614174000'
      const resourceOwnerId = '123e4567-e89b-12d3-a456-426614174001'

      try {
        ensureOwnership(authenticatedUserId, resourceOwnerId)
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).message).toContain('resource')
      }
    })
  })

  describe('canAccessResource', () => {
    it('should return true when user IDs match', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'

      expect(canAccessResource(userId, userId)).toBe(true)
    })

    it('should return false when user IDs do not match', () => {
      const authenticatedUserId = '123e4567-e89b-12d3-a456-426614174000'
      const resourceOwnerId = '123e4567-e89b-12d3-a456-426614174001'

      expect(canAccessResource(authenticatedUserId, resourceOwnerId)).toBe(false)
    })
  })

  describe('requireOwnership', () => {
    it('should return user ID when authentication and ownership are valid', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-user-id': userId,
        },
      })

      const result = requireOwnership(request, userId, 'resource')
      expect(result).toBe(userId)
    })

    it('should throw UnauthorizedError when not authenticated', () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      const resourceOwnerId = '123e4567-e89b-12d3-a456-426614174000'

      expect(() => requireOwnership(request, resourceOwnerId, 'resource')).toThrow(
        'Authentication required'
      )
    })

    it('should throw ForbiddenError when user does not own resource', () => {
      const authenticatedUserId = '123e4567-e89b-12d3-a456-426614174000'
      const resourceOwnerId = '123e4567-e89b-12d3-a456-426614174001'
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-user-id': authenticatedUserId,
        },
      })

      expect(() => requireOwnership(request, resourceOwnerId, 'resource')).toThrow(
        'do not have permission'
      )
    })

    it('should use default resource name when no custom resource is provided', () => {
      const authenticatedUserId = '123e4567-e89b-12d3-a456-426614174000'
      const resourceOwnerId = '123e4567-e89b-12d3-a456-426614174001'
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-user-id': authenticatedUserId,
        },
      })

      expect(() => requireOwnership(request, resourceOwnerId)).toThrow('access this resource')
    })
  })
})
