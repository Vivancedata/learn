import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  NotFoundError,
  validateParams,
} from '@/lib/api-errors'
import { xpUserParamsSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import { getUserXpInfo } from '@/lib/xp-service'
import {
  getTierForLevel,
  getTierConfigForLevel,
  getLevelName,
} from '@/lib/xp-config'

/**
 * GET /api/xp/user/[userId]
 * Get user's XP information including level, progress, and recent transactions
 * @param userId - The user ID from URL params
 * @returns User XP info with level details and recent transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    validateParams({ userId }, xpUserParamsSchema)

    // Authorization: Users can only view their own XP
    requireOwnership(request, userId, 'XP information')

    const xpInfo = await getUserXpInfo(userId, 10)

    if (!xpInfo) {
      throw new NotFoundError('User')
    }

    const tier = getTierForLevel(xpInfo.level)
    const tierConfig = getTierConfigForLevel(xpInfo.level)
    const levelName = getLevelName(xpInfo.level)

    return apiSuccess({
      totalXp: xpInfo.totalXp,
      level: xpInfo.level,
      levelName,
      xpToNextLevel: xpInfo.xpToNextLevel,
      levelProgress: xpInfo.levelProgress,
      tier,
      tierConfig: {
        name: tierConfig.name,
        color: tierConfig.color,
        bgColor: tierConfig.bgColor,
        borderColor: tierConfig.borderColor,
        icon: tierConfig.icon,
      },
      recentTransactions: xpInfo.recentTransactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        source: t.source,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
