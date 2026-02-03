/**
 * POST /api/recommendations/click
 * Track when a user clicks on a course recommendation
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, parseRequestBody, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { clickRecommendationSchema } from '@/lib/validations'
import { trackRecommendationClick } from '@/lib/recommendations'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, clickRecommendationSchema)

    // Authorization check: users can only track clicks on their own recommendations
    requireOwnership(request, body.userId, 'recommendation')

    // Track the click
    await trackRecommendationClick(body.userId, body.courseId)

    return apiSuccess(
      {
        success: true,
        message: 'Click tracked',
      },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
