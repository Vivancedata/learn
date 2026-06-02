import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getUserId, requireAuth } from '@/lib/auth'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { createSubmissionSchema, validateBody } from '@/lib/validations'
import {
  apiSuccess,
  handleApiError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  ApiError,
  HTTP_STATUS,
} from '@/lib/api-errors'

// GET - List submissions for current user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      throw new UnauthorizedError()
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const courseId = searchParams.get('courseId')

    const where: { userId: string; lessonId?: string } = { userId }
    if (lessonId) where.lessonId = lessonId

    const submissions = await prisma.projectSubmission.findMany({
      where,
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // Filter by courseId if provided
    const filteredSubmissions = courseId
      ? submissions.filter(s => s.lesson.section.course.id === courseId)
      : submissions

    return apiSuccess(filteredSubmissions)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = await checkRateLimit(identifier, RATE_LIMITS.API)
    if (!rateLimitResult.success) {
      throw new ApiError(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too many requests. Please try again later.'
      )
    }

    const body = await request.json()
    const validation = validateBody(createSubmissionSchema, body)
    if (!validation.success) {
      throw new ValidationError(validation.error)
    }

    const { lessonId, githubUrl, liveUrl, notes } = validation.data

    // Check if lesson exists and is a project
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    })

    if (!lesson) {
      throw new NotFoundError('Lesson')
    }

    // Check for existing submission
    const existingSubmission = await prisma.projectSubmission.findFirst({
      where: { userId, lessonId },
    })

    if (existingSubmission) {
      // Update existing submission
      const updated = await prisma.projectSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          githubUrl,
          liveUrl: liveUrl || null,
          notes: notes || null,
          status: 'pending',
          feedback: null,
          reviewedAt: null,
          reviewedBy: null,
          submittedAt: new Date(),
        },
      })
      return apiSuccess(updated)
    }

    // Create new submission
    const submission = await prisma.projectSubmission.create({
      data: {
        userId,
        lessonId,
        githubUrl,
        liveUrl: liveUrl || null,
        notes: notes || null,
        status: 'pending',
      },
    })

    return apiSuccess(submission, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}
