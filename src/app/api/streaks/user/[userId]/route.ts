import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'

/**
 * GET /api/streaks/user/[userId]
 * Get user's streak information including current streak, longest streak,
 * streak freezes, and recent daily activity (last 7 days)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // SECURITY: User can only view their own streak info
    requireOwnership(request, userId, 'streak information')

    // Check if user exists and get streak data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezes: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentActivity = await prisma.dailyActivity.findMany({
      where: {
        userId,
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        date: true,
        xpEarned: true,
        lessonsCompleted: true,
        quizzesTaken: true,
        timeSpentMinutes: true,
      },
    })

    // Check if streak needs to be updated based on last activity
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let streakStatus: 'active' | 'at_risk' | 'broken' = 'active'

    if (user.lastActivityDate) {
      const lastActivity = new Date(user.lastActivityDate)
      lastActivity.setHours(0, 0, 0, 0)

      if (lastActivity.getTime() < yesterday.getTime()) {
        // Streak is broken (more than 1 day ago)
        streakStatus = 'broken'
      } else if (lastActivity.getTime() === yesterday.getTime()) {
        // Need to be active today to maintain streak
        streakStatus = 'at_risk'
      }
    } else if (user.currentStreak === 0) {
      // No activity yet, streak is not started
      streakStatus = 'broken'
    }

    // Calculate activity for today
    const todayActivity = recentActivity.find(activity => {
      const activityDate = new Date(activity.date)
      activityDate.setHours(0, 0, 0, 0)
      return activityDate.getTime() === today.getTime()
    })

    return apiSuccess({
      userId: user.id,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActivityDate: user.lastActivityDate,
      streakFreezes: user.streakFreezes,
      streakStatus,
      todayActive: !!todayActivity,
      todayStats: todayActivity ? {
        xpEarned: todayActivity.xpEarned,
        lessonsCompleted: todayActivity.lessonsCompleted,
        quizzesTaken: todayActivity.quizzesTaken,
        timeSpentMinutes: todayActivity.timeSpentMinutes,
      } : null,
      recentActivity: recentActivity.map(activity => ({
        date: activity.date,
        xpEarned: activity.xpEarned,
        lessonsCompleted: activity.lessonsCompleted,
        quizzesTaken: activity.quizzesTaken,
        timeSpentMinutes: activity.timeSpentMinutes,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
