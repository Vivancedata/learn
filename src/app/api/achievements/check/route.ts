import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, handleApiError, parseRequestBody, NotFoundError, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { runAchievementsCheck } from '@/lib/achievements-service'

const checkAchievementsSchema = z.object({
  userId: z.string().uuid(),
})

/**
 * POST /api/achievements/check
 * Check and award new achievements for a user.
 *
 * The evaluation logic lives in `runAchievementsCheck` (lib/achievements-service)
 * so the same checks can be triggered server-side from completion events.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, checkAchievementsSchema)

    // Authorization check
    requireOwnership(request, body.userId, 'achievement check')

    const result = await runAchievementsCheck(body.userId)

    if (!result) {
      throw new NotFoundError('User')
    }

    return apiSuccess(
      {
        achievements: result.achievements,
        newAchievements: result.newAchievements,
        stats: result.stats,
      },
      result.newAchievements.length > 0 ? HTTP_STATUS.CREATED : HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
