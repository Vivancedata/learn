import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-errors'
import { projectSubmissionSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import { getUserId } from '@/lib/auth'

/**
 * POST /api/projects
 * Submit a project for a lesson
 * @body userId - The user ID
 * @body lessonId - The lesson ID
 * @body githubUrl - GitHub repository URL
 * @body liveUrl - Optional live demo URL
 * @body notes - Optional submission notes
 * @returns Created project submission
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, projectSubmissionSchema)

    const { userId, lessonId, githubUrl, liveUrl, notes } = body

    // Authorization: Users can only submit their own projects
    requireOwnership(request, userId, 'project submission')

    // Verify the lesson exists and has a project
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    })

    if (!lesson) {
      throw new NotFoundError('Lesson')
    }

    if (!lesson.hasProject) {
      return apiSuccess(
        { error: 'This lesson does not require a project submission' },
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Check if user already submitted for this lesson
    const existingSubmission = await prisma.projectSubmission.findFirst({
      where: {
        userId,
        lessonId,
      },
    })

    if (existingSubmission) {
      // Update existing submission
      const updatedSubmission = await prisma.projectSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          githubUrl,
          liveUrl: liveUrl || null,
          notes: notes || null,
          status: 'pending', // Reset to pending on resubmission
          submittedAt: new Date(),
          feedback: null,
          reviewedAt: null,
          reviewedBy: null,
        },
      })

      return apiSuccess(
        {
          submissionId: updatedSubmission.id,
          status: updatedSubmission.status,
          submittedAt: updatedSubmission.submittedAt,
          message: 'Project resubmitted successfully',
        },
        HTTP_STATUS.OK
      )
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

    return apiSuccess(
      {
        submissionId: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        message: 'Project submitted successfully',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/projects?userId=xxx&lessonId=xxx
 * Get project submissions
 * @query userId - Filter by user ID (required, must match authenticated user)
 * @query lessonId - Filter by lesson ID (optional)
 * @query status - Filter by status (optional)
 * @returns Array of project submissions
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID from middleware-injected header
    const authenticatedUserId = getUserId(request)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const lessonId = searchParams.get('lessonId')
    const status = searchParams.get('status')

    // Authorization: Users can only fetch their own submissions
    // If userId is provided, it must match the authenticated user
    // If not provided, default to authenticated user's submissions
    const targetUserId = userId || authenticatedUserId
    if (targetUserId !== authenticatedUserId) {
      throw new ForbiddenError('You can only view your own project submissions')
    }

    const where: Record<string, string> = { userId: targetUserId! }
    if (lessonId) where.lessonId = lessonId
    if (status) where.status = status

    const submissions = await prisma.projectSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    return apiSuccess(submissions)
  } catch (error) {
    return handleApiError(error)
  }
}
