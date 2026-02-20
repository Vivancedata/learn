import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  ValidationError,
} from '@/lib/api-errors'
import { getLeaderboardSchema } from '@/lib/validations'
import { getAuthenticatedUserId } from '@/lib/authorization'
import {
  LeaderboardType,
  LeaderboardPeriod,
  LeaderboardEntry,
  LeaderboardResponse,
  leaderboardTypeToEnum,
  leaderboardPeriodToEnum,
} from '@/types/leaderboard'

/**
 * GET /api/leaderboards
 * Get leaderboard data for a specific type and period
 * @query type - Leaderboard type (xp, streaks, courses, lessons, helping)
 * @query period - Time period (daily, weekly, monthly, all_time)
 * @query limit - Number of entries to return (default: 50, max: 100)
 * @returns Ranked list with user info, score, and rank changes
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (optional - for highlighting current user)
    let currentUserId: string | null = null
    try {
      currentUserId = getAuthenticatedUserId(request)
    } catch {
      // User not authenticated - that's okay for leaderboards
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const validationResult = getLeaderboardSchema.safeParse({
      type: searchParams.get('type') || undefined,
      period: searchParams.get('period') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!validationResult.success) {
      throw new ValidationError('Invalid query parameters', validationResult.error.flatten())
    }

    const { type, period, limit } = validationResult.data

    // Convert to Prisma enum values
    const prismaType = leaderboardTypeToEnum[type as LeaderboardType]
    const prismaPeriod = leaderboardPeriodToEnum[period as LeaderboardPeriod]

    // Try to get cached leaderboard data
    const cachedEntries = await prisma.leaderboardCache.findMany({
      where: {
        type: prismaType as 'XP' | 'STREAKS' | 'COURSES_COMPLETED' | 'LESSONS_COMPLETED' | 'HELPING_POINTS',
        period: prismaPeriod as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            showOnLeaderboard: true,
          },
        },
      },
      orderBy: {
        rank: 'asc',
      },
      take: limit,
    })

    let entries: LeaderboardEntry[]
    let calculatedAt: Date

    if (cachedEntries.length > 0) {
      // Use cached data
      calculatedAt = cachedEntries[0].calculatedAt
      entries = cachedEntries
        .filter(entry => entry.user.showOnLeaderboard)
        .map(entry => ({
          id: entry.id,
          rank: entry.rank,
          previousRank: entry.previousRank,
          userId: entry.userId,
          userName: entry.user.name || entry.user.email.split('@')[0],
          score: entry.score,
          metadata: entry.metadata ? safeJsonParse(entry.metadata, {}) : undefined,
          isCurrentUser: currentUserId === entry.userId,
        }))
    } else {
      // No cached data - calculate on the fly
      calculatedAt = new Date()
      entries = await calculateLeaderboard(type as LeaderboardType, period as LeaderboardPeriod, limit, currentUserId)
    }

    // Get current user's rank if they're not in the top list
    let currentUserRank: LeaderboardEntry | undefined
    if (currentUserId && !entries.some(e => e.isCurrentUser)) {
      const userCacheEntry = await prisma.leaderboardCache.findUnique({
        where: {
          type_period_userId: {
            type: prismaType as 'XP' | 'STREAKS' | 'COURSES_COMPLETED' | 'LESSONS_COMPLETED' | 'HELPING_POINTS',
            period: prismaPeriod as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME',
            userId: currentUserId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              showOnLeaderboard: true,
            },
          },
        },
      })

      if (userCacheEntry && userCacheEntry.user.showOnLeaderboard) {
        currentUserRank = {
          id: userCacheEntry.id,
          rank: userCacheEntry.rank,
          previousRank: userCacheEntry.previousRank,
          userId: userCacheEntry.userId,
          userName: userCacheEntry.user.name || userCacheEntry.user.email.split('@')[0],
          score: userCacheEntry.score,
          metadata: userCacheEntry.metadata ? safeJsonParse(userCacheEntry.metadata, {}) : undefined,
          isCurrentUser: true,
        }
      }
    }

    const response: LeaderboardResponse = {
      entries,
      type: type as LeaderboardType,
      period: period as LeaderboardPeriod,
      calculatedAt: calculatedAt.toISOString(),
      currentUserRank,
    }

    return apiSuccess(response)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Calculate leaderboard data on the fly (fallback when cache is empty)
 */
async function calculateLeaderboard(
  type: LeaderboardType,
  period: LeaderboardPeriod,
  limit: number,
  currentUserId: string | null
): Promise<LeaderboardEntry[]> {
  const dateFilter = getDateFilter(period)

  switch (type) {
    case 'xp':
      return calculateXPLeaderboard(dateFilter, limit, currentUserId)
    case 'streaks':
      return calculateStreaksLeaderboard(limit, currentUserId)
    case 'courses':
      return calculateCoursesLeaderboard(dateFilter, limit, currentUserId)
    case 'lessons':
      return calculateLessonsLeaderboard(dateFilter, limit, currentUserId)
    case 'helping':
      return calculateHelpingLeaderboard(dateFilter, limit, currentUserId)
    /* istanbul ignore next - safeguarded by Zod enum validation */
    default:
      return []
  }
}

/**
 * Get date filter based on period
 */
function getDateFilter(period: LeaderboardPeriod): Date | null {
  const now = new Date()

  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'weekly':
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek)
      startOfWeek.setHours(0, 0, 0, 0)
      return startOfWeek
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'all_time':
    default:
      return null
  }
}

/**
 * Calculate XP leaderboard
 */
async function calculateXPLeaderboard(
  dateFilter: Date | null,
  limit: number,
  currentUserId: string | null
): Promise<LeaderboardEntry[]> {
  // Get users with XP from daily activities
  const users = await prisma.user.findMany({
    where: {
      showOnLeaderboard: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      points: true,
      dailyActivities: dateFilter
        ? {
            where: {
              date: { gte: dateFilter },
            },
            select: {
              xpEarned: true,
            },
          }
        : undefined,
    },
    orderBy: {
      points: 'desc',
    },
    take: limit * 2, // Get extra to ensure we have enough after filtering
  })

  // Calculate total XP for the period
  const usersWithScore = users.map(user => ({
    ...user,
    score: dateFilter && user.dailyActivities
      ? user.dailyActivities.reduce((sum, da) => sum + da.xpEarned, 0)
      : user.points,
  }))

  // Sort by score and assign ranks
  usersWithScore.sort((a, b) => b.score - a.score)

  return usersWithScore
    .slice(0, limit)
    .map((user, index) => ({
      id: user.id,
      rank: index + 1,
      previousRank: null,
      userId: user.id,
      userName: user.name || user.email.split('@')[0],
      score: user.score,
      isCurrentUser: currentUserId === user.id,
    }))
}

/**
 * Calculate streaks leaderboard
 */
async function calculateStreaksLeaderboard(
  limit: number,
  currentUserId: string | null
): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: {
      showOnLeaderboard: true,
      currentStreak: { gt: 0 },
    },
    select: {
      id: true,
      name: true,
      email: true,
      currentStreak: true,
      longestStreak: true,
    },
    orderBy: {
      currentStreak: 'desc',
    },
    take: limit,
  })

  return users.map((user, index) => ({
    id: user.id,
    rank: index + 1,
    previousRank: null,
    userId: user.id,
    userName: user.name || user.email.split('@')[0],
    score: user.currentStreak,
    metadata: {
      streakDays: user.currentStreak,
      longestStreak: user.longestStreak,
    },
    isCurrentUser: currentUserId === user.id,
  }))
}

/**
 * Calculate courses completed leaderboard
 */
async function calculateCoursesLeaderboard(
  dateFilter: Date | null,
  limit: number,
  currentUserId: string | null
): Promise<LeaderboardEntry[]> {
  // Count certificates per user (as proxy for completed courses)
  const userCertificates = await prisma.certificate.groupBy({
    by: ['userId'],
    where: dateFilter
      ? {
          issueDate: { gte: dateFilter },
        }
      : undefined,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  })

  // Get user details
  const userIds = userCertificates.map(uc => uc.userId)
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      showOnLeaderboard: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  return userCertificates
    .filter(uc => userMap.has(uc.userId))
    .map((uc, index) => {
      const user = userMap.get(uc.userId)!
      return {
        id: uc.userId,
        rank: index + 1,
        previousRank: null,
        userId: uc.userId,
        userName: user.name || user.email.split('@')[0],
        score: uc._count.id,
        isCurrentUser: currentUserId === uc.userId,
      }
    })
}

/**
 * Calculate lessons completed leaderboard
 */
async function calculateLessonsLeaderboard(
  dateFilter: Date | null,
  limit: number,
  currentUserId: string | null
): Promise<LeaderboardEntry[]> {
  // Get users with their completed lessons count from daily activities
  if (dateFilter) {
    const activities = await prisma.dailyActivity.groupBy({
      by: ['userId'],
      where: {
        date: { gte: dateFilter },
      },
      _sum: {
        lessonsCompleted: true,
      },
      orderBy: {
        _sum: {
          lessonsCompleted: 'desc',
        },
      },
      take: limit,
    })

    const userIds = activities.map(a => a.userId)
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        showOnLeaderboard: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    return activities
      .filter(a => userMap.has(a.userId))
      .map((a, index) => {
        const user = userMap.get(a.userId)!
        return {
          id: a.userId,
          rank: index + 1,
          previousRank: null,
          userId: a.userId,
          userName: user.name || user.email.split('@')[0],
          score: a._sum.lessonsCompleted || 0,
          isCurrentUser: currentUserId === a.userId,
        }
      })
  }

  // All time - count from CourseProgress completed lessons
  const userProgress = await prisma.courseProgress.findMany({
    select: {
      userId: true,
      completedLessons: {
        select: { id: true },
      },
    },
  })

  // Aggregate by user
  const userLessonsMap = new Map<string, number>()
  userProgress.forEach(cp => {
    const current = userLessonsMap.get(cp.userId) || 0
    userLessonsMap.set(cp.userId, current + cp.completedLessons.length)
  })

  // Sort by lessons completed
  const sortedUsers = Array.from(userLessonsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  const userIds = sortedUsers.map(([userId]) => userId)
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      showOnLeaderboard: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  return sortedUsers
    .filter(([userId]) => userMap.has(userId))
    .map(([userId, score], index) => {
      const user = userMap.get(userId)!
      return {
        id: userId,
        rank: index + 1,
        previousRank: null,
        userId,
        userName: user.name || user.email.split('@')[0],
        score,
        isCurrentUser: currentUserId === userId,
      }
    })
}

/**
 * Calculate helping points leaderboard
 */
async function calculateHelpingLeaderboard(
  dateFilter: Date | null,
  limit: number,
  currentUserId: string | null
): Promise<LeaderboardEntry[]> {
  const communityPoints = await prisma.communityPoint.groupBy({
    by: ['recipientId'],
    where: dateFilter
      ? {
          createdAt: { gte: dateFilter },
        }
      : undefined,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  })

  const userIds = communityPoints.map(cp => cp.recipientId)
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      showOnLeaderboard: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  return communityPoints
    .filter(cp => userMap.has(cp.recipientId))
    .map((cp, index) => {
      const user = userMap.get(cp.recipientId)!
      return {
        id: cp.recipientId,
        rank: index + 1,
        previousRank: null,
        userId: cp.recipientId,
        userName: user.name || user.email.split('@')[0],
        score: cp._count.id,
        isCurrentUser: currentUserId === cp.recipientId,
      }
    })
}

/**
 * Safely parse JSON string
 */
function safeJsonParse<T>(value: string, defaultValue: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return defaultValue
  }
}
