import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/auth/me
 * Get the current authenticated user's information
 * @returns User data
 */
export async function GET(request: NextRequest) {
  try {
    // No credentials at all means a logged-out visitor: answer 200 with
    // user: null so the browser console does not log a 401 on every first
    // page view. A token or cookie that fails verification still gets 401.
    const hasCredentials =
      Boolean(request.headers.get('authorization')?.startsWith('Bearer ')) ||
      request.cookies.has('auth-token')

    if (!hasCredentials) {
      return apiSuccess({ user: null }, HTTP_STATUS.OK)
    }

    // Require authentication - will throw if not authenticated
    const session = await requireAuth(request)

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        githubUsername: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return apiSuccess(
      {
        user,
      },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
