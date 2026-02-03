/**
 * POST /api/recommendations/refresh
 * Force regenerate course recommendations for a user
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, parseRequestBody, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { refreshRecommendationsSchema } from '@/lib/validations'
import { generateRecommendations } from '@/lib/recommendations'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, refreshRecommendationsSchema)

    // Authorization check: users can only refresh their own recommendations
    requireOwnership(request, body.userId, 'recommendations')

    // Generate fresh recommendations (bypasses cache)
    const recommendations = await generateRecommendations(body.userId)

    return apiSuccess(
      {
        recommendations,
        count: recommendations.length,
        refreshedAt: new Date().toISOString(),
      },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
