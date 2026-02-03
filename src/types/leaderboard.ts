/**
 * Leaderboard Types
 * Types for the leaderboard feature
 */

export type LeaderboardType = 'xp' | 'streaks' | 'courses' | 'lessons' | 'helping'
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time'

// Map frontend type values to Prisma enum values
export const leaderboardTypeToEnum: Record<LeaderboardType, string> = {
  xp: 'XP',
  streaks: 'STREAKS',
  courses: 'COURSES_COMPLETED',
  lessons: 'LESSONS_COMPLETED',
  helping: 'HELPING_POINTS',
}

export const leaderboardPeriodToEnum: Record<LeaderboardPeriod, string> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  all_time: 'ALL_TIME',
}

// Display names for leaderboard types
export const leaderboardTypeLabels: Record<LeaderboardType, string> = {
  xp: 'XP Points',
  streaks: 'Learning Streaks',
  courses: 'Courses Completed',
  lessons: 'Lessons Completed',
  helping: 'Helping Points',
}

export const leaderboardPeriodLabels: Record<LeaderboardPeriod, string> = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  all_time: 'All Time',
}

export interface LeaderboardEntry {
  id: string
  rank: number
  previousRank: number | null
  userId: string
  userName: string | null
  score: number
  metadata?: LeaderboardMetadata
  isCurrentUser?: boolean
}

export interface LeaderboardMetadata {
  streakDays?: number
  courseNames?: string[]
  lessonTitles?: string[]
  [key: string]: unknown
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  type: LeaderboardType
  period: LeaderboardPeriod
  calculatedAt: string
  currentUserRank?: LeaderboardEntry
}

export interface UserRankings {
  userId: string
  rankings: UserRankingEntry[]
}

export interface UserRankingEntry {
  type: LeaderboardType
  period: LeaderboardPeriod
  rank: number
  previousRank: number | null
  score: number
  totalParticipants: number
}

export interface RankChange {
  direction: 'up' | 'down' | 'same' | 'new'
  amount: number
}

/**
 * Calculate rank change from previous rank
 */
export function calculateRankChange(currentRank: number, previousRank: number | null): RankChange {
  if (previousRank === null) {
    return { direction: 'new', amount: 0 }
  }

  if (currentRank < previousRank) {
    return { direction: 'up', amount: previousRank - currentRank }
  } else if (currentRank > previousRank) {
    return { direction: 'down', amount: currentRank - previousRank }
  }

  return { direction: 'same', amount: 0 }
}
