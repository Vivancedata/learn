/**
 * XP Service
 * Business logic for awarding XP and managing user levels
 */

import { XpSource } from '@prisma/client'
import prisma from './db'
import {
  XP_VALUES,
  STREAK_BONUSES,
  calculateLevelFromXp,
  calculateXpToNextLevel,
  calculateLevelProgress,
  getXpDescription,
} from './xp-config'

// ============================================================================
// Types
// ============================================================================

export interface XpAwardResult {
  success: boolean
  xpAwarded: number
  newTotalXp: number
  previousLevel: number
  newLevel: number
  leveledUp: boolean
  xpToNextLevel: number
  levelProgress: number
}

export interface UserXpInfo {
  totalXp: number
  level: number
  xpToNextLevel: number
  levelProgress: number
  recentTransactions: {
    id: string
    amount: number
    source: XpSource
    description: string
    createdAt: Date
  }[]
}

export interface XpHistoryOptions {
  page?: number
  limit?: number
  source?: XpSource
}

export interface XpHistoryResult {
  transactions: {
    id: string
    amount: number
    source: XpSource
    sourceId: string | null
    description: string
    createdAt: Date
  }[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// Core XP Functions
// ============================================================================

/**
 * Award XP to a user
 * Handles level-up calculations and transaction recording
 */
export async function awardXp(
  userId: string,
  amount: number,
  source: XpSource,
  sourceId?: string,
  description?: string
): Promise<XpAwardResult> {
  // Get current user stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXp: true, level: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const previousLevel = user.level
  const previousXp = user.totalXp
  const newTotalXp = previousXp + amount

  // Calculate new level
  const newLevel = calculateLevelFromXp(newTotalXp)
  const xpToNextLevel = calculateXpToNextLevel(newTotalXp)
  const levelProgress = calculateLevelProgress(newTotalXp)
  const leveledUp = newLevel > previousLevel

  // Create transaction and update user in a single transaction
  await prisma.$transaction([
    // Record the XP transaction
    prisma.xpTransaction.create({
      data: {
        userId,
        amount,
        source,
        sourceId,
        description: description || getXpDescription(source),
      },
    }),
    // Update user's XP and level
    prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: newTotalXp,
        level: newLevel,
        xpToNextLevel,
      },
    }),
  ])

  return {
    success: true,
    xpAwarded: amount,
    newTotalXp,
    previousLevel,
    newLevel,
    leveledUp,
    xpToNextLevel,
    levelProgress,
  }
}

/**
 * Award XP for completing a lesson
 */
export async function awardLessonCompleteXp(
  userId: string,
  lessonId: string,
  lessonTitle?: string
): Promise<XpAwardResult> {
  return awardXp(
    userId,
    XP_VALUES.LESSON_COMPLETE,
    'LESSON_COMPLETE',
    lessonId,
    lessonTitle ? `Completed lesson: ${lessonTitle}` : undefined
  )
}

/**
 * Award XP for passing a quiz
 * @param isPerfect - If true, awards perfect score bonus instead of pass bonus
 */
export async function awardQuizXp(
  userId: string,
  lessonId: string,
  percentage: number,
  lessonTitle?: string
): Promise<XpAwardResult | null> {
  // No XP for failing quizzes
  if (percentage < 70) {
    return null
  }

  const isPerfect = percentage === 100
  const xpAmount = isPerfect ? XP_VALUES.QUIZ_PERFECT : XP_VALUES.QUIZ_PASS
  const source: XpSource = isPerfect ? 'QUIZ_PERFECT' : 'QUIZ_PASS'

  const description = isPerfect
    ? `Perfect quiz score${lessonTitle ? `: ${lessonTitle}` : ''}`
    : `Passed quiz${lessonTitle ? `: ${lessonTitle}` : ''} (${percentage}%)`

  return awardXp(userId, xpAmount, source, lessonId, description)
}

/**
 * Award XP for submitting a project
 */
export async function awardProjectSubmitXp(
  userId: string,
  projectId: string,
  projectTitle?: string
): Promise<XpAwardResult> {
  return awardXp(
    userId,
    XP_VALUES.PROJECT_SUBMIT,
    'PROJECT_SUBMIT',
    projectId,
    projectTitle ? `Submitted project: ${projectTitle}` : undefined
  )
}

/**
 * Award XP for having a project approved
 */
export async function awardProjectApprovedXp(
  userId: string,
  projectId: string,
  projectTitle?: string
): Promise<XpAwardResult> {
  return awardXp(
    userId,
    XP_VALUES.PROJECT_APPROVED,
    'PROJECT_APPROVED',
    projectId,
    projectTitle ? `Project approved: ${projectTitle}` : undefined
  )
}

/**
 * Award XP for daily login
 */
export async function awardDailyLoginXp(userId: string): Promise<XpAwardResult> {
  return awardXp(
    userId,
    XP_VALUES.DAILY_LOGIN,
    'DAILY_LOGIN',
    undefined,
    'Daily login bonus'
  )
}

/**
 * Award XP for reaching streak milestones
 */
export async function awardStreakBonusXp(
  userId: string,
  streakDays: number
): Promise<XpAwardResult | null> {
  let xpAmount: number
  let description: string

  if (streakDays === STREAK_BONUSES.MONTH.days) {
    xpAmount = STREAK_BONUSES.MONTH.xp
    description = `${STREAK_BONUSES.MONTH.days}-day streak milestone`
  } else if (streakDays === STREAK_BONUSES.WEEK.days) {
    xpAmount = STREAK_BONUSES.WEEK.xp
    description = `${STREAK_BONUSES.WEEK.days}-day streak milestone`
  } else {
    // Not a milestone day
    return null
  }

  return awardXp(userId, xpAmount, 'STREAK_BONUS', undefined, description)
}

/**
 * Award XP for helping others (community points)
 */
export async function awardHelpingOthersXp(
  userId: string,
  referenceId?: string
): Promise<XpAwardResult> {
  return awardXp(
    userId,
    XP_VALUES.HELPING_OTHERS,
    'HELPING_OTHERS',
    referenceId,
    'Received a point for helping another learner'
  )
}

/**
 * Award XP for earning an achievement
 */
export async function awardAchievementXp(
  userId: string,
  achievementId: string,
  achievementName: string,
  xpAmount?: number
): Promise<XpAwardResult> {
  return awardXp(
    userId,
    xpAmount || XP_VALUES.ACHIEVEMENT,
    'ACHIEVEMENT',
    achievementId,
    `Earned achievement: ${achievementName}`
  )
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get user's XP information
 */
export async function getUserXpInfo(
  userId: string,
  recentTransactionsLimit = 10
): Promise<UserXpInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalXp: true,
      level: true,
      xpToNextLevel: true,
      xpTransactions: {
        orderBy: { createdAt: 'desc' },
        take: recentTransactionsLimit,
        select: {
          id: true,
          amount: true,
          source: true,
          description: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  return {
    totalXp: user.totalXp,
    level: user.level,
    xpToNextLevel: user.xpToNextLevel,
    levelProgress: calculateLevelProgress(user.totalXp),
    recentTransactions: user.xpTransactions,
  }
}

/**
 * Get paginated XP transaction history
 */
export async function getXpHistory(
  userId: string,
  options: XpHistoryOptions = {}
): Promise<XpHistoryResult> {
  const { page = 1, limit = 10, source } = options
  const skip = (page - 1) * limit

  const whereClause = {
    userId,
    ...(source && { source }),
  }

  const [transactions, total] = await Promise.all([
    prisma.xpTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        source: true,
        sourceId: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.xpTransaction.count({ where: whereClause }),
  ])

  return {
    transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Check if user has already received XP for a specific source
 * Useful for preventing duplicate awards
 */
export async function hasReceivedXpFor(
  userId: string,
  source: XpSource,
  sourceId: string
): Promise<boolean> {
  const existing = await prisma.xpTransaction.findFirst({
    where: {
      userId,
      source,
      sourceId,
    },
  })

  return !!existing
}
