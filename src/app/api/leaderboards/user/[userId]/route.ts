import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  NotFoundError,
} from '@/lib/api-errors'
import {
  LeaderboardType,
  LeaderboardPeriod,
  UserRankings,
  UserRankingEntry,
  leaderboardTypeLabels,
  leaderboardPeriodLabels,
} from '@/types/leaderboard'

const leaderboardTypes: LeaderboardType[] = ['xp', 'streaks', 'courses', 'lessons', 'helping']
const leaderboardPeriods: LeaderboardPeriod[] = ['daily', 'weekly', 'monthly', 'all_time']

// Map frontend type values to Prisma enum values
const typeToEnum: Record<LeaderboardType, 'XP' | 'STREAKS' | 'COURSES_COMPLETED' | 'LESSONS_COMPLETED' | 'HELPING_POINTS'> = {
  xp: 'XP',
  streaks: 'STREAKS',
  courses: 'COURSES_COMPLETED',
  lessons: 'LESSONS_COMPLETED',
  helping: 'HELPING_POINTS',
}

const periodToEnum: Record<LeaderboardPeriod, 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  all_time: 'ALL_TIME',
}

/**
 * GET /api/leaderboards/user/[userId]
 * Get a user's rankings across all leaderboard types and periods
 * @param userId - The user ID to get rankings for
 * @returns User's rank in each leaderboard type and period
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        showOnLeaderboard: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Get all cached rankings for this user
    const cachedRankings = await prisma.leaderboardCache.findMany({
      where: { userId },
      select: {
        type: true,
        period: true,
        rank: true,
        previousRank: true,
        score: true,
      },
    })

    // Count total participants for each type/period combo
    const totalParticipantsCounts = await Promise.all(
      leaderboardTypes.flatMap(type =>
        leaderboardPeriods.map(async period => {
          const count = await prisma.leaderboardCache.count({
            where: {
              type: typeToEnum[type],
              period: periodToEnum[period],
            },
          })
          return { type, period, count }
        })
      )
    )

    const participantsMap = new Map<string, number>()
    totalParticipantsCounts.forEach(({ type, period, count }) => {
      participantsMap.set(`${type}-${period}`, count)
    })

    // Build rankings response
    const rankings: UserRankingEntry[] = []

    for (const type of leaderboardTypes) {
      for (const period of leaderboardPeriods) {
        const cached = cachedRankings.find(
          r => r.type === typeToEnum[type] && r.period === periodToEnum[period]
        )

        if (cached) {
          rankings.push({
            type,
            period,
            rank: cached.rank,
            previousRank: cached.previousRank,
            score: cached.score,
            totalParticipants: participantsMap.get(`${type}-${period}`) || 0,
          })
        }
      }
    }

    // Sort by rank (best rankings first)
    rankings.sort((a, b) => a.rank - b.rank)

    const response: UserRankings & {
      userName: string
      showOnLeaderboard: boolean
      typeLabels: Record<LeaderboardType, string>
      periodLabels: Record<LeaderboardPeriod, string>
    } = {
      userId: user.id,
      userName: user.name || user.email.split('@')[0],
      showOnLeaderboard: user.showOnLeaderboard,
      rankings,
      typeLabels: leaderboardTypeLabels,
      periodLabels: leaderboardPeriodLabels,
    }

    return apiSuccess(response)
  } catch (error) {
    return handleApiError(error)
  }
}
