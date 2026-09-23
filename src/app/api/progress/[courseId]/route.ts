import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { apiSuccess, handleApiError, UnauthorizedError } from '@/lib/api-errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const userId = getUserId(request)

    if (!userId) {
      throw new UnauthorizedError()
    }

    // The user's progress and the course's lesson count are independent, and
    // both branches below need the lesson count.
    const [progress, course] = await Promise.all([
      prisma.courseProgress.findFirst({
        where: {
          userId,
          courseId,
        },
        include: {
          completedLessons: {
            select: {
              id: true,
            },
          },
          quizScores: true,
        },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
              lessons: {
                select: { id: true },
              },
            },
          },
        },
      }),
    ])

    const totalLessons = course?.sections.reduce(
      (acc, section) => acc + section.lessons.length,
      0
    ) || 0

    // If no progress exists, return empty progress
    if (!progress) {
      return apiSuccess({
        courseId,
        completedLessonIds: [],
        completedCount: 0,
        totalLessons,
        percentComplete: 0,
        quizScores: [],
      })
    }

    const completedCount = progress.completedLessons.length
    const percentComplete = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0

    return apiSuccess({
      courseId,
      completedLessonIds: progress.completedLessons.map(l => l.id),
      completedCount,
      totalLessons,
      percentComplete,
      quizScores: progress.quizScores,
      lastAccessed: progress.lastAccessed,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
