import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'

/**
 * GET /api/achievements/user/[userId]
 * Get all achievements for a user (user can only view their own achievements)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // SECURITY: User can only view their own achievements
    requireOwnership(request, userId, 'achievements')

    // Check the user exists and fetch their achievements in parallel
    const [user, userAchievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }),
      prisma.userAchievement.findMany({
        where: {
          userId,
        },
        include: {
          achievement: true,
        },
        orderBy: {
          earnedAt: 'desc',
        },
      }),
    ])

    if (!user) {
      throw new NotFoundError('User')
    }

    return apiSuccess({
      achievements: userAchievements,
      count: userAchievements.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
