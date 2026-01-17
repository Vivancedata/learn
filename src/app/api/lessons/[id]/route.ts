import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import { validateParams } from '@/lib/api-errors'
import { lessonIdSchema } from '@/lib/validations'
import { adaptLessonWithQuiz } from '@/lib/type-adapters'

/**
 * GET /api/lessons/[id]
 * Fetches a specific lesson by ID with quiz questions and discussions
 * @param params.id - The lesson UUID
 * @returns Lesson data with quiz questions and discussions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate lesson ID format
    const { lessonId } = validateParams(
      { lessonId: id },
      lessonIdSchema
    )

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        section: {
          include: {
            course: true,
          },
        },
        quizQuestions: true,
        discussions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      throw new NotFoundError('Lesson')
    }

    const adaptedLesson = adaptLessonWithQuiz(lesson)

    return apiSuccess(adaptedLesson)
  } catch (error) {
    return handleApiError(error)
  }
}
