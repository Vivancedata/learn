/**
 * Achievements Service
 *
 * Single source of truth for evaluating and awarding a user's achievements.
 * Extracted from the `/api/achievements/check` route so the same logic can be
 * triggered server-side as a side effect of completion events (finishing a
 * lesson, passing a quiz, submitting a project, earning a certificate, …)
 * rather than relying on the client to call the check endpoint.
 */

import prisma from './db'
import { checkNewAchievements, ACHIEVEMENTS, UserStats } from './achievements'
import { awardAchievementXp, hasReceivedXpFor } from './xp-service'

export interface AchievementCheckResult {
  stats: UserStats
  newAchievements: string[]
  achievements: unknown[]
}

/**
 * Compute a user's current stats and award any newly-earned achievements.
 *
 * Returns `null` if the user does not exist. Idempotent: already-owned
 * achievements are skipped and duplicate inserts are ignored. Each newly
 * earned achievement also grants its bonus XP (deduplicated via the XP
 * transaction log), so XP failures never block achievement awards.
 */
export async function runAchievementsCheck(
  userId: string
): Promise<AchievementCheckResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: {
          achievement: true,
        },
      },
      courses: {
        include: {
          completedLessons: true,
          quizScores: true,
          course: {
            include: {
              sections: {
                include: {
                  lessons: true,
                },
              },
            },
          },
        },
      },
      projectSubmissions: true,
      certificates: true,
      discussions: true,
      discussionReplies: true,
    },
  })

  if (!user) {
    return null
  }

  // Calculate user statistics
  const completedLessonsCount = user.courses.reduce(
    (sum, progress) => sum + progress.completedLessons.length,
    0
  )

  // Count courses where all lessons are completed
  const completedCoursesCount = user.courses.filter((progress) => {
    const totalLessons =
      progress.course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.length || 0),
        0
      ) || 0
    return progress.completedLessons.length >= totalLessons && totalLessons > 0
  }).length

  const quizzesPassed = user.courses.reduce(
    (sum, progress) => sum + progress.quizScores.length,
    0
  )

  // Count only genuinely perfect (100%) quiz scores, not merely passed ones.
  const perfectQuizzes = user.courses.reduce(
    (sum, progress) =>
      sum +
      progress.quizScores.filter(
        (qs) => qs.maxScore > 0 && qs.score >= qs.maxScore
      ).length,
    0
  )

  const totalLearningHours = user.courses.reduce((sum, progress) => {
    return sum + (progress.course.durationHours || 0)
  }, 0)

  const daysActive = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate completed paths from the paths the user has actually started.
  const startedPathIds = Array.from(
    new Set(
      user.courses
        .map((progress) => progress.course.pathId)
        .filter((pathId): pathId is string => Boolean(pathId))
    )
  )

  let completedPathsCount = 0

  if (startedPathIds.length > 0) {
    const candidatePaths = await prisma.path.findMany({
      where: {
        id: {
          in: startedPathIds,
        },
      },
      select: {
        id: true,
        courses: {
          select: {
            id: true,
            sections: {
              select: {
                lessons: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const progressByCourseId = new Map(
      user.courses.map((progress) => [progress.courseId, progress])
    )

    completedPathsCount = candidatePaths.filter((path) => {
      if (path.courses.length === 0) return false

      return path.courses.every((course) => {
        const totalLessons = course.sections.reduce(
          (sum, section) => sum + section.lessons.length,
          0
        )

        if (totalLessons === 0) return false

        const userProgress = progressByCourseId.get(course.id)
        if (!userProgress) return false

        return userProgress.completedLessons.length >= totalLessons
      })
    }).length
  }

  // Total courses on the platform — drives the "Completionist" achievement.
  const totalCoursesAvailable = await prisma.course.count()

  const stats: UserStats = {
    completedLessons: completedLessonsCount,
    completedCourses: completedCoursesCount,
    completedPaths: completedPathsCount,
    quizzesPassed,
    perfectQuizzes,
    projectsSubmitted: user.projectSubmissions.length,
    certificatesEarned: user.certificates.length,
    discussionsPosts: user.discussions.length + user.discussionReplies.length,
    daysActive,
    totalLearningHours,
    totalCoursesAvailable,
  }

  const currentAchievementIds = user.achievements.map((ua) => ua.achievement.id)
  const newAchievementIds = checkNewAchievements(stats, currentAchievementIds)

  if (newAchievementIds.length > 0) {
    for (const achId of newAchievementIds) {
      const achDef = ACHIEVEMENTS.find((a) => a.id === achId)
      if (!achDef) continue

      // Ensure the achievement definition exists in the database
      let achievement = await prisma.achievement.findUnique({
        where: { id: achId },
      })

      if (!achievement) {
        achievement = await prisma.achievement.create({
          data: {
            id: achId,
            name: achDef.name,
            description: achDef.description,
            icon: achDef.icon,
          },
        })
      }

      // Award achievement to user (ignore duplicate from unique constraint)
      await prisma.userAchievement
        .create({
          data: {
            userId,
            achievementId: achId,
          },
        })
        .catch(() => {
          // Ignore if already exists
        })

      // Grant the achievement's bonus XP, deduplicated and non-fatal.
      try {
        if (!(await hasReceivedXpFor(userId, 'ACHIEVEMENT', achId))) {
          await awardAchievementXp(userId, achId, achDef.name)
        }
      } catch (xpError) {
        void xpError // XP failure must not block achievement awards
      }
    }
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: {
          achievement: true,
        },
        orderBy: {
          earnedAt: 'desc',
        },
      },
    },
  })

  return {
    stats,
    newAchievements: newAchievementIds,
    achievements: updatedUser?.achievements || [],
  }
}
