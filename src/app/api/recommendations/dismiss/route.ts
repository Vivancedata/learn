/**
 * POST /api/recommendations/dismiss
 * Dismiss a course recommendation
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, parseRequestBody, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { dismissRecommendationSchema } from '@/lib/validations'
import { dismissRecommendation } from '@/lib/recommendations'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, dismissRecommendationSchema)

    // Authorization check: users can only dismiss their own recommendations
    requireOwnership(request, body.userId, 'recommendation')

    // Dismiss the recommendation
    await dismissRecommendation(body.userId, body.courseId)

    return apiSuccess(
      {
        success: true,
        message: 'Recommendation dismissed',
      },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
