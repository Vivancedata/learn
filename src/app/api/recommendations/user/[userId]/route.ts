/**
 * GET /api/recommendations/user/[userId]
 * Get personalized course recommendations for a user
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, UnauthorizedError } from '@/lib/api-errors'
import { getUserId } from '@/lib/auth'
import { getRecommendations } from '@/lib/recommendations'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Get authenticated user ID from middleware-injected headers
    const authenticatedUserId = getUserId(request)
    if (!authenticatedUserId) {
      throw new UnauthorizedError('Authentication required')
    }

    // Get userId from params
    const params = await context.params
    const { userId } = params

    // Authorization check: users can only access their own recommendations
    if (authenticatedUserId !== userId) {
      throw new UnauthorizedError('You can only access your own recommendations')
    }

    // Get recommendations (cached or newly generated)
    const recommendations = await getRecommendations(userId)

    return apiSuccess({
      recommendations,
      count: recommendations.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
