/**
 * XP (Experience Points) Configuration
 * Defines XP values, level calculations, and tier configurations
 */

export type XpSource =
  | 'LESSON_COMPLETE'
  | 'QUIZ_PASS'
  | 'QUIZ_PERFECT'
  | 'PROJECT_SUBMIT'
  | 'PROJECT_APPROVED'
  | 'DAILY_LOGIN'
  | 'STREAK_BONUS'
  | 'ACHIEVEMENT'
  | 'HELPING_OTHERS'

// ============================================================================
// XP Values
// ============================================================================

export const XP_VALUES: Record<XpSource, number> = {
  LESSON_COMPLETE: 50,
  QUIZ_PASS: 30,
  QUIZ_PERFECT: 100,
  PROJECT_SUBMIT: 75,
  PROJECT_APPROVED: 150,
  DAILY_LOGIN: 10,
  STREAK_BONUS: 50, // Default for 7-day streak
  ACHIEVEMENT: 50,  // Default, can vary by achievement
  HELPING_OTHERS: 5,
}

// Streak bonus tiers
export const STREAK_BONUSES = {
  WEEK: { days: 7, xp: 50 },
  MONTH: { days: 30, xp: 200 },
} as const

// ============================================================================
// Level Calculations
// ============================================================================

/**
 * Calculate XP required for a specific level
 * Formula: XP needed = 100 * (level ^ 1.5)
 *
 * Level 1: 0 XP (starting level)
 * Level 2: 100 XP
 * Level 3: 250 XP (cumulative)
 * Level 4: 500 XP (cumulative)
 * Level 5: 1000 XP (cumulative)
 */
export function calculateXpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level, 1.5))
}

/**
 * Calculate cumulative XP required to reach a specific level
 */
export function calculateCumulativeXpForLevel(level: number): number {
  let totalXp = 0
  for (let i = 2; i <= level; i++) {
    totalXp += calculateXpForLevel(i)
  }
  return totalXp
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXp(totalXp: number): number {
  let level = 1
  let cumulativeXp = 0

  while (true) {
    const xpForNextLevel = calculateXpForLevel(level + 1)
    if (cumulativeXp + xpForNextLevel > totalXp) {
      break
    }
    cumulativeXp += xpForNextLevel
    level++
  }

  return level
}

/**
 * Calculate XP needed to reach the next level
 */
export function calculateXpToNextLevel(totalXp: number): number {
  const currentLevel = calculateLevelFromXp(totalXp)
  const cumulativeForCurrentLevel = calculateCumulativeXpForLevel(currentLevel)
  const xpForNextLevel = calculateXpForLevel(currentLevel + 1)

  return xpForNextLevel - (totalXp - cumulativeForCurrentLevel)
}

/**
 * Calculate progress percentage toward next level (0-100)
 */
export function calculateLevelProgress(totalXp: number): number {
  const currentLevel = calculateLevelFromXp(totalXp)
  const cumulativeForCurrentLevel = calculateCumulativeXpForLevel(currentLevel)
  const xpForNextLevel = calculateXpForLevel(currentLevel + 1)
  const xpIntoCurrentLevel = totalXp - cumulativeForCurrentLevel

  if (xpForNextLevel === 0) return 100
  return Math.floor((xpIntoCurrentLevel / xpForNextLevel) * 100)
}

// ============================================================================
// Level Tiers
// ============================================================================

export type LevelTier = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface TierConfig {
  name: string
  minLevel: number
  maxLevel: number
  color: string
  bgColor: string
  borderColor: string
  icon: string
}

export const LEVEL_TIERS: Record<LevelTier, TierConfig> = {
  bronze: {
    name: 'Bronze',
    minLevel: 1,
    maxLevel: 10,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-400',
    icon: 'shield',
  },
  silver: {
    name: 'Silver',
    minLevel: 11,
    maxLevel: 25,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-400',
    icon: 'shield',
  },
  gold: {
    name: 'Gold',
    minLevel: 26,
    maxLevel: 50,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    icon: 'crown',
  },
  diamond: {
    name: 'Diamond',
    minLevel: 51,
    maxLevel: Infinity,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-400',
    icon: 'gem',
  },
}

/**
 * Get tier for a specific level
 */
export function getTierForLevel(level: number): LevelTier {
  if (level <= LEVEL_TIERS.bronze.maxLevel) return 'bronze'
  if (level <= LEVEL_TIERS.silver.maxLevel) return 'silver'
  if (level <= LEVEL_TIERS.gold.maxLevel) return 'gold'
  return 'diamond'
}

/**
 * Get tier configuration for a specific level
 */
export function getTierConfigForLevel(level: number): TierConfig {
  return LEVEL_TIERS[getTierForLevel(level)]
}

// ============================================================================
// XP Descriptions
// ============================================================================

export const XP_DESCRIPTIONS: Record<XpSource, string> = {
  LESSON_COMPLETE: 'Completed a lesson',
  QUIZ_PASS: 'Passed a quiz',
  QUIZ_PERFECT: 'Perfect quiz score',
  PROJECT_SUBMIT: 'Submitted a project',
  PROJECT_APPROVED: 'Project approved',
  DAILY_LOGIN: 'Daily login bonus',
  STREAK_BONUS: 'Streak milestone reached',
  ACHIEVEMENT: 'Earned an achievement',
  HELPING_OTHERS: 'Helped another learner',
}

/**
 * Get a human-readable description for an XP source
 */
export function getXpDescription(source: XpSource, customDescription?: string): string {
  return customDescription || XP_DESCRIPTIONS[source]
}

// ============================================================================
// Level Names (optional, for display)
// ============================================================================

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Novice',
  5: 'Apprentice',
  10: 'Student',
  15: 'Practitioner',
  20: 'Scholar',
  25: 'Expert',
  30: 'Master',
  40: 'Grandmaster',
  50: 'Legend',
  75: 'Mythic',
  100: 'Transcendent',
}

/**
 * Get the level name for a specific level
 */
export function getLevelName(level: number): string {
  const milestones = Object.keys(LEVEL_NAMES)
    .map(Number)
    .sort((a, b) => b - a)

  for (const milestone of milestones) {
    if (level >= milestone) {
      return LEVEL_NAMES[milestone]
    }
  }

  return 'Novice'
}
