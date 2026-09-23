import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getUserId, requireAuth } from '@/lib/auth'
import {
  apiSuccess,
  handleApiError,
  UnauthorizedError,
  NotFoundError,
  ApiError,
  HTTP_STATUS,
} from '@/lib/api-errors'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params
    const session = await requireAuth(request)
    const userId = session.userId

    // Look up the lesson (to verify it belongs to the course) and the user's
    // existing course progress in parallel -- neither depends on the other.
    const [lesson, existingProgress] = await Promise.all([
      prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      }),
      prisma.courseProgress.findFirst({
        where: {
          userId,
          courseId,
        },
      }),
    ])

    if (!lesson || lesson.section.course.id !== courseId) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Lesson not found in this course')
    }

    // Get or create course progress
    let progress = existingProgress

    if (!progress) {
      progress = await prisma.courseProgress.create({
        data: {
          userId,
          courseId,
        },
      })
    }

    // Check if lesson is already completed
    const existingCompletion = await prisma.courseProgress.findFirst({
      where: {
        id: progress.id,
        completedLessons: {
          some: {
            id: lessonId,
          },
        },
      },
    })

    if (existingCompletion) {
      return apiSuccess({
        message: 'Lesson already completed',
        lessonId,
        courseId,
      })
    }

    // Mark lesson as complete
    await prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedLessons: {
          connect: { id: lessonId },
        },
        lastAccessed: new Date(),
      },
    })

    // Get updated progress stats and total lessons
    const [updatedProgress, course] = await Promise.all([
      prisma.courseProgress.findUnique({
        where: { id: progress.id },
        include: {
          completedLessons: {
            select: { id: true },
          },
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

    const completedCount = updatedProgress?.completedLessons.length || 0
    const percentComplete = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0

    return apiSuccess({
      message: 'Lesson marked as complete',
      lessonId,
      courseId,
      completedCount,
      totalLessons,
      percentComplete,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params
    const userId = getUserId(request)

    if (!userId) {
      throw new UnauthorizedError()
    }

    // Get course progress
    const progress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
    })

    if (!progress) {
      throw new NotFoundError('Progress')
    }

    // Remove lesson from completed
    await prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedLessons: {
          disconnect: { id: lessonId },
        },
      },
    })

    return apiSuccess({
      message: 'Lesson marked as incomplete',
      lessonId,
      courseId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
