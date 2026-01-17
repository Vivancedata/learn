import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { markLessonCompleteSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'

/**
 * POST /api/progress/lessons
 * Marks a lesson as complete for a user
 * @body userId - The user ID
 * @body courseId - The course ID
 * @body lessonId - The lesson ID to mark complete
 * @returns Updated progress information
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, markLessonCompleteSchema)

    const { userId, courseId, lessonId } = body

    // Authorization: Users can only mark their own lessons complete
    requireOwnership(request, userId, 'progress')

    // Find or create course progress for this user
    let courseProgress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
      include: {
        completedLessons: true,
      },
    })

    if (!courseProgress) {
      // Create new progress record
      courseProgress = await prisma.courseProgress.create({
        data: {
          userId,
          courseId,
          completedLessons: {
            connect: { id: lessonId },
          },
          lastAccessed: new Date(),
        },
        include: {
          completedLessons: true,
        },
      })
    } else {
      // Check if lesson is already completed
      const isAlreadyCompleted = courseProgress.completedLessons.some(
        (lesson) => lesson.id === lessonId
      )

      if (!isAlreadyCompleted) {
        // Update progress to include this lesson
        courseProgress = await prisma.courseProgress.update({
          where: {
            id: courseProgress.id,
          },
          data: {
            completedLessons: {
              connect: { id: lessonId },
            },
            lastAccessed: new Date(),
          },
          include: {
            completedLessons: true,
          },
        })
      } else {
        // Just update last accessed time
        courseProgress = await prisma.courseProgress.update({
          where: {
            id: courseProgress.id,
          },
          data: {
            lastAccessed: new Date(),
          },
          include: {
            completedLessons: true,
          },
        })
      }
    }

    return apiSuccess(
      {
        progressId: courseProgress.id,
        completedLessonsCount: courseProgress.completedLessons.length,
        lastAccessed: courseProgress.lastAccessed,
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/progress/lessons?userId=xxx&courseId=xxx
 * Gets progress for a specific user and course
 * @query userId - The user ID
 * @query courseId - The course ID
 * @returns Progress information with completed lessons
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')

    if (!userId || !courseId) {
      return apiSuccess({ completedLessons: [], totalCompleted: 0 })
    }

    // Authorization: Users can only view their own progress
    requireOwnership(request, userId, 'progress')

    const progress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
      include: {
        completedLessons: {
          select: {
            id: true,
            title: true,
          },
        },
        quizScores: true,
      },
    })

    if (!progress) {
      return apiSuccess({ completedLessons: [], totalCompleted: 0 })
    }

    return apiSuccess({
      completedLessons: progress.completedLessons,
      totalCompleted: progress.completedLessons.length,
      quizScores: progress.quizScores,
      lastAccessed: progress.lastAccessed,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
