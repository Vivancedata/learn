import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { clearAuthCookie } from '@/lib/auth'

/**
 * POST /api/auth/signout
 * Sign out the current user by clearing the authentication cookie
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    // Clear authentication cookie
    await clearAuthCookie()

    return apiSuccess(
      {
        message: 'Signed out successfully',
      },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
