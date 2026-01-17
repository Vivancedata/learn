/**
 * Authorization utilities for API routes
 * Handles user permissions and access control
 */

import { NextRequest } from 'next/server'
import { ApiError, HTTP_STATUS } from './api-errors'

/**
 * Get the authenticated user ID from request headers
 * (Set by middleware after authentication)
 */
export function getAuthenticatedUserId(request: NextRequest): string {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication required. Please sign in.'
    )
  }

  return userId
}

/**
 * Ensure the authenticated user matches the resource owner
 * Throws 403 Forbidden if user IDs don't match
 */
export function ensureOwnership(
  authenticatedUserId: string,
  resourceOwnerId: string,
  resourceName = 'resource'
): void {
  if (authenticatedUserId !== resourceOwnerId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      `You do not have permission to access this ${resourceName}`
    )
  }
}

/**
 * Check if user has permission to access a resource
 * Returns true if user is the owner
 */
export function canAccessResource(
  authenticatedUserId: string,
  resourceOwnerId: string
): boolean {
  return authenticatedUserId === resourceOwnerId
}

/**
 * Combined authentication and authorization check
 * Returns authenticated user ID if they own the resource
 */
export function requireOwnership(
  request: NextRequest,
  resourceOwnerId: string,
  resourceName = 'resource'
): string {
  const userId = getAuthenticatedUserId(request)
  ensureOwnership(userId, resourceOwnerId, resourceName)
  return userId
}
