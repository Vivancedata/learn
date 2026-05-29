/**
 * Streak Service
 * Single source of truth for recording daily activity and updating a user's
 * learning streak. Previously this logic was duplicated between
 * `api/streaks/record` and `api/progress/lessons`, which risked the two
 * implementations drifting apart.
 */

import prisma from './db'
import { NotFoundError } from './api-errors'

export type StreakAction = 'started' | 'continued' | 'extended' | 'maintained'

export interface ActivityInput {
  xpEarned?: number
  lessonsCompleted?: number
  quizzesTaken?: number
  timeSpentMinutes?: number
}

export interface StreakResult {
  userId: string
  currentStreak: number
  longestStreak: number
  lastActivityDate: Date | null
  streakFreezes: number
  streakAction: StreakAction
  todayActivity: {
    date: Date
    xpEarned: number
    lessonsCompleted: number
    quizzesTaken: number
    timeSpentMinutes: number
  }
}

/**
 * Start of today (local server time), normalized to midnight.
 */
export function getTodayStart(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Start of yesterday (local server time), normalized to midnight.
 */
export function getYesterdayStart(): Date {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  return yesterday
}

/**
 * Record a day's learning activity and update the user's streak.
 *
 * Upserts today's `DailyActivity` row (incrementing counters when the user is
 * active multiple times in a day) and recomputes the streak based on the last
 * activity date, automatically consuming a streak freeze when exactly one day
 * was missed and freezes are available.
 *
 * @throws NotFoundError if the user does not exist.
 */
export async function recordActivityAndUpdateStreak(
  userId: string,
  activity: ActivityInput = {}
): Promise<StreakResult> {
  const xpEarned = activity.xpEarned || 0
  const lessonsCompleted = activity.lessonsCompleted || 0
  const quizzesTaken = activity.quizzesTaken || 0
  const timeSpentMinutes = activity.timeSpentMinutes || 0

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

  const today = getTodayStart()
  const yesterday = getYesterdayStart()

  // Upsert today's activity record
  const dailyActivity = await prisma.dailyActivity.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      xpEarned,
      lessonsCompleted,
      quizzesTaken,
      timeSpentMinutes,
    },
    update: {
      xpEarned: { increment: xpEarned },
      lessonsCompleted: { increment: lessonsCompleted },
      quizzesTaken: { increment: quizzesTaken },
      timeSpentMinutes: { increment: timeSpentMinutes },
    },
  })

  // Calculate streak updates
  let newStreak = user.currentStreak
  let newLongestStreak = user.longestStreak
  let streakAction: StreakAction = 'maintained'

  if (user.lastActivityDate) {
    const lastActivity = new Date(user.lastActivityDate)
    lastActivity.setHours(0, 0, 0, 0)

    if (lastActivity.getTime() === today.getTime()) {
      // Already active today - maintain current streak
      streakAction = 'maintained'
    } else if (lastActivity.getTime() === yesterday.getTime()) {
      // Consecutive day - extend streak
      newStreak = user.currentStreak + 1
      streakAction = 'extended'
    } else {
      // Streak was broken - check if a freeze should be used
      const daysSinceActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceActivity === 2 && user.streakFreezes > 0) {
        // One day missed, use freeze automatically if available.
        // The freeze preserves the streak from yesterday.
        newStreak = user.currentStreak + 1
        streakAction = 'continued'

        await prisma.user.update({
          where: { id: userId },
          data: {
            streakFreezes: { decrement: 1 },
          },
        })
      } else {
        // Streak is broken - restart at 1
        newStreak = 1
        streakAction = 'started'
      }
    }
  } else {
    // First activity ever - start streak at 1
    newStreak = 1
    streakAction = 'started'
  }

  // Update longest streak if needed
  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak
  }

  // Persist the user's streak data
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
    },
    select: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      lastActivityDate: true,
      streakFreezes: true,
    },
  })

  return {
    userId: updatedUser.id,
    currentStreak: updatedUser.currentStreak,
    longestStreak: updatedUser.longestStreak,
    lastActivityDate: updatedUser.lastActivityDate,
    streakFreezes: updatedUser.streakFreezes,
    streakAction,
    todayActivity: {
      date: dailyActivity.date,
      xpEarned: dailyActivity.xpEarned,
      lessonsCompleted: dailyActivity.lessonsCompleted,
      quizzesTaken: dailyActivity.quizzesTaken,
      timeSpentMinutes: dailyActivity.timeSpentMinutes,
    },
  }
}
