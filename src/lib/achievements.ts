/**
 * Achievement definitions and logic
 * Tracks user accomplishments and milestones
 */

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  icon: string
  checkCondition: (stats: UserStats) => boolean
}

export interface UserStats {
  completedLessons: number
  completedCourses: number
  completedPaths: number
  quizzesPassed: number
  /** Quizzes answered with a perfect (100%) score. */
  perfectQuizzes: number
  projectsSubmitted: number
  certificatesEarned: number
  discussionsPosts: number
  daysActive: number
  totalLearningHours: number
  /** Total number of courses that exist on the platform. */
  totalCoursesAvailable: number
}

/**
 * All available achievements
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Lesson Milestones
  {
    id: 'first-lesson',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    checkCondition: (stats) => stats.completedLessons >= 1,
  },
  {
    id: 'lesson-master-10',
    name: 'Lesson Master',
    description: 'Complete 10 lessons',
    icon: '📚',
    checkCondition: (stats) => stats.completedLessons >= 10,
  },
  {
    id: 'lesson-expert-50',
    name: 'Learning Expert',
    description: 'Complete 50 lessons',
    icon: '🎓',
    checkCondition: (stats) => stats.completedLessons >= 50,
  },
  {
    id: 'lesson-legend-100',
    name: 'Learning Legend',
    description: 'Complete 100 lessons',
    icon: '🏆',
    checkCondition: (stats) => stats.completedLessons >= 100,
  },

  // Course Milestones
  {
    id: 'first-course',
    name: 'Course Crusher',
    description: 'Complete your first course',
    icon: '✅',
    checkCondition: (stats) => stats.completedCourses >= 1,
  },
  {
    id: 'multi-course-master',
    name: 'Multi-Course Master',
    description: 'Complete 3 courses',
    icon: '🌟',
    checkCondition: (stats) => stats.completedCourses >= 3,
  },
  {
    id: 'course-collector',
    name: 'Course Collector',
    description: 'Complete 5 courses',
    icon: '💎',
    checkCondition: (stats) => stats.completedCourses >= 5,
  },

  // Path Milestones
  {
    id: 'path-pioneer',
    name: 'Path Pioneer',
    description: 'Complete an entire learning path',
    icon: '🗺️',
    checkCondition: (stats) => stats.completedPaths >= 1,
  },

  // Quiz Achievements
  {
    id: 'quiz-rookie',
    name: 'Quiz Rookie',
    description: 'Pass 5 quizzes',
    icon: '📝',
    checkCondition: (stats) => stats.quizzesPassed >= 5,
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Pass 20 quizzes',
    icon: '🧠',
    checkCondition: (stats) => stats.quizzesPassed >= 20,
  },
  {
    id: 'perfect-score',
    name: 'Perfect Scholar',
    description: 'Get 100% on 10 quizzes',
    icon: '💯',
    checkCondition: (stats) => stats.perfectQuizzes >= 10,
  },

  // Project Achievements
  {
    id: 'first-project',
    name: 'Builder',
    description: 'Submit your first project',
    icon: '🔨',
    checkCondition: (stats) => stats.projectsSubmitted >= 1,
  },
  {
    id: 'prolific-builder',
    name: 'Prolific Builder',
    description: 'Submit 5 projects',
    icon: '🏗️',
    checkCondition: (stats) => stats.projectsSubmitted >= 5,
  },
  {
    id: 'master-builder',
    name: 'Master Builder',
    description: 'Submit 10 projects',
    icon: '🏰',
    checkCondition: (stats) => stats.projectsSubmitted >= 10,
  },

  // Certificate Achievements
  {
    id: 'certified',
    name: 'Certified Professional',
    description: 'Earn your first certificate',
    icon: '📜',
    checkCondition: (stats) => stats.certificatesEarned >= 1,
  },
  {
    id: 'multi-certified',
    name: 'Multi-Certified',
    description: 'Earn 3 certificates',
    icon: '🎖️',
    checkCondition: (stats) => stats.certificatesEarned >= 3,
  },

  // Community Achievements
  {
    id: 'discussion-starter',
    name: 'Discussion Starter',
    description: 'Post in discussions 5 times',
    icon: '💬',
    checkCondition: (stats) => stats.discussionsPosts >= 5,
  },
  {
    id: 'community-contributor',
    name: 'Community Contributor',
    description: 'Post in discussions 20 times',
    icon: '🗣️',
    checkCondition: (stats) => stats.discussionsPosts >= 20,
  },

  // Consistency Achievements
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Be active for 7 consecutive days',
    icon: '📅',
    checkCondition: (stats) => stats.daysActive >= 7,
  },
  {
    id: 'month-champion',
    name: 'Month Champion',
    description: 'Be active for 30 days',
    icon: '🗓️',
    checkCondition: (stats) => stats.daysActive >= 30,
  },
  {
    id: 'year-legend',
    name: 'Year Legend',
    description: 'Be active for 365 days',
    icon: '👑',
    checkCondition: (stats) => stats.daysActive >= 365,
  },

  // Time Achievements
  {
    id: 'learning-hours-10',
    name: 'Dedicated Learner',
    description: 'Complete 10 hours of learning',
    icon: '⏰',
    checkCondition: (stats) => stats.totalLearningHours >= 10,
  },
  {
    id: 'learning-hours-50',
    name: 'Learning Enthusiast',
    description: 'Complete 50 hours of learning',
    icon: '⌚',
    checkCondition: (stats) => stats.totalLearningHours >= 50,
  },
  {
    id: 'learning-hours-100',
    name: 'Time Master',
    description: 'Complete 100 hours of learning',
    icon: '⏳',
    checkCondition: (stats) => stats.totalLearningHours >= 100,
  },

  // Special Achievements
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Join VivanceData during beta',
    icon: '🚀',
    checkCondition: () => true, // Manually awarded
  },
  {
    id: 'completionist',
    name: 'The Completionist',
    description: 'Complete every available course',
    icon: '🎯',
    checkCondition: (stats) =>
      stats.totalCoursesAvailable > 0 &&
      stats.completedCourses >= stats.totalCoursesAvailable,
  },
]

/**
 * Check which new achievements a user has earned
 * @param stats User's current statistics
 * @param currentAchievementIds IDs of achievements user already has
 * @returns Array of newly earned achievement IDs
 */
export function checkNewAchievements(
  stats: UserStats,
  currentAchievementIds: string[]
): string[] {
  const currentSet = new Set(currentAchievementIds)
  const newAchievements: string[] = []

  for (const achievement of ACHIEVEMENTS) {
    // Skip if user already has this achievement
    if (currentSet.has(achievement.id)) {
      continue
    }

    // Check if user now qualifies for this achievement
    if (achievement.checkCondition(stats)) {
      newAchievements.push(achievement.id)
    }
  }

  return newAchievements
}

/**
 * Get achievement by ID
 */
export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

/**
 * Get all achievements organized by category
 */
export function getAchievementsByCategory() {
  return {
    lessons: ACHIEVEMENTS.filter((a) => a.id.startsWith('lesson-') || a.id === 'first-lesson'),
    courses: ACHIEVEMENTS.filter((a) => a.id.includes('course')),
    paths: ACHIEVEMENTS.filter((a) => a.id.includes('path')),
    quizzes: ACHIEVEMENTS.filter((a) => a.id.includes('quiz')),
    projects: ACHIEVEMENTS.filter((a) => a.id.includes('project') || a.id.includes('builder')),
    certificates: ACHIEVEMENTS.filter((a) => a.id.includes('certified')),
    community: ACHIEVEMENTS.filter((a) => a.id.includes('discussion') || a.id.includes('community')),
    consistency: ACHIEVEMENTS.filter((a) => a.id.includes('warrior') || a.id.includes('champion') || a.id.includes('legend')),
    time: ACHIEVEMENTS.filter((a) => a.id.includes('hours')),
    special: ACHIEVEMENTS.filter((a) => a.id === 'early-adopter' || a.id === 'completionist'),
  }
}
