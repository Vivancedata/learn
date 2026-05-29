import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { awardXpSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import { awardXp } from '@/lib/xp-service'
import {
  getTierForLevel,
  getTierConfigForLevel,
  getLevelName,
  XP_VALUES,
} from '@/lib/xp-config'
import type { XpSource } from '@/lib/xp-config'

/**
 * POST /api/xp/award
 * Award XP to a user
 * @body userId - The user ID
 * @body amount - Amount of XP to award
 * @body source - Source of XP (LESSON_COMPLETE, QUIZ_PASS, etc.)
 * @body sourceId - Optional ID of the source (lesson ID, quiz ID, etc.)
 * @body description - Description of why XP was awarded
 * @returns Updated XP information including level-up status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, awardXpSchema)

    const { userId, source, sourceId, description } = body

    // Authorization: Users can only receive XP for themselves
    requireOwnership(request, userId, 'XP award')

    // The amount is derived server-side from the canonical XP table for the
    // given source — never from the client — to prevent self-awarding
    // arbitrary XP. Variable awards (achievements, streak milestones) go
    // through the dedicated helpers in xp-service.
    const amount = XP_VALUES[source as XpSource]

    const result = await awardXp(
      userId,
      amount,
      source as XpSource,
      sourceId,
      description
    )

    const tier = getTierForLevel(result.newLevel)
    const tierConfig = getTierConfigForLevel(result.newLevel)
    const levelName = getLevelName(result.newLevel)

    return apiSuccess(
      {
        success: result.success,
        xpAwarded: result.xpAwarded,
        totalXp: result.newTotalXp,
        previousLevel: result.previousLevel,
        level: result.newLevel,
        levelName,
        leveledUp: result.leveledUp,
        xpToNextLevel: result.xpToNextLevel,
        levelProgress: result.levelProgress,
        tier,
        tierConfig: {
          name: tierConfig.name,
          color: tierConfig.color,
          bgColor: tierConfig.bgColor,
          borderColor: tierConfig.borderColor,
          icon: tierConfig.icon,
        },
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}
