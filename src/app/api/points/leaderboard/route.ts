import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
} from '@/lib/api-errors'

/**
 * GET /api/points/leaderboard
 * Get the top community helpers
 * @query limit - Number of users to return (default: 10, max: 50)
 * @returns Top users by points who have opted into the leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // Get top users who have opted into the leaderboard
    const topHelpers = await prisma.user.findMany({
      where: {
        showOnLeaderboard: true,
        points: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        githubUsername: true,
      },
      orderBy: {
        points: 'desc',
      },
      take: limit,
    })

    // Get total count of users with points
    const totalHelpersCount = await prisma.user.count({
      where: {
        showOnLeaderboard: true,
        points: {
          gt: 0,
        },
      },
    })

    // Format the response
    const leaderboard = topHelpers.map((user: { id: string; name: string | null; email: string; points: number; githubUsername: string | null }, index: number) => ({
      rank: index + 1,
      user: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        githubUsername: user.githubUsername,
      },
      points: user.points,
      badge: getHelperBadge(user.points),
    }))

    return apiSuccess({
      leaderboard,
      totalHelpers: totalHelpersCount,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Determine helper badge based on points
 */
function getHelperBadge(points: number): {
  level: string
  name: string
  minPoints: number
} | null {
  if (points >= 40) {
    return { level: 'super', name: 'Super Helper', minPoints: 40 }
  }
  if (points >= 10) {
    return { level: 'helper', name: 'Community Helper', minPoints: 10 }
  }
  return null
}
