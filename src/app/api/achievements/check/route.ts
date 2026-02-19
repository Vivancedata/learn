import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError, parseRequestBody, NotFoundError, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import { checkNewAchievements, ACHIEVEMENTS, UserStats } from '@/lib/achievements'

const checkAchievementsSchema = z.object({
  userId: z.string().uuid(),
})

/**
 * POST /api/achievements/check
 * Check and award new achievements for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, checkAchievementsSchema)

    // Authorization check
    requireOwnership(request, body.userId, 'achievement check')

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
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
      throw new NotFoundError('User')
    }

    // 2. Calculate user statistics
    const completedLessonsCount = user.courses.reduce(
      (sum, progress) => sum + progress.completedLessons.length,
      0
    )

    // Count courses where all lessons are completed
    const completedCoursesCount = user.courses.filter((progress) => {
      // BUG FIX: Count lessons, not sections!
      const totalLessons = progress.course.sections?.reduce(
        (sum, section) => sum + (section.lessons?.length || 0),
        0
      ) || 0
      return progress.completedLessons.length >= totalLessons && totalLessons > 0
    }).length

    const quizzesPassed = user.courses.reduce(
      (sum, progress) => sum + progress.quizScores.length,
      0
    )

    const totalLearningHours = user.courses.reduce((sum, progress) => {
      return sum + (progress.course.durationHours || 0)
    }, 0)

    const daysActive = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Calculate completed paths from the paths the user has actually started.
    // This avoids scanning every path in the system on each check.
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

    const stats: UserStats = {
      completedLessons: completedLessonsCount,
      completedCourses: completedCoursesCount,
      completedPaths: completedPathsCount,
      quizzesPassed,
      projectsSubmitted: user.projectSubmissions.length,
      certificatesEarned: user.certificates.length,
      discussionsPosts: user.discussions.length + user.discussionReplies.length,
      daysActive,
      totalLearningHours,
    }

    // 3. Get current achievement IDs
    const currentAchievementIds = user.achievements.map((ua) => ua.achievement.id)

    // 4. Check for new achievements
    const newAchievementIds = checkNewAchievements(stats, currentAchievementIds)

    // 5. If there are new achievements, award them
    if (newAchievementIds.length > 0) {
      // First, ensure all achievement definitions exist in database
      for (const achId of newAchievementIds) {
        const achDef = ACHIEVEMENTS.find((a) => a.id === achId)
        if (!achDef) continue

        // Check if achievement exists in database
        let achievement = await prisma.achievement.findUnique({
          where: { id: achId },
        })

        // Create if doesn't exist
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

        // Award achievement to user (if not already awarded)
        await prisma.userAchievement.create({
          data: {
            userId: body.userId,
            achievementId: achId,
          },
        }).catch(() => {
          // Ignore if already exists (unique constraint)
        })
      }
    }

    // 6. Get updated achievements
    const updatedUser = await prisma.user.findUnique({
      where: { id: body.userId },
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

    return apiSuccess(
      {
        achievements: updatedUser?.achievements || [],
        newAchievements: newAchievementIds,
        stats,
      },
      newAchievementIds.length > 0 ? HTTP_STATUS.CREATED : HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
