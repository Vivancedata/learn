import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { updateSubmissionSchema } from '@/lib/validations'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-errors'

// GET - Get a specific submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserId(request)

    if (!userId) {
      throw new UnauthorizedError()
    }

    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    // Only allow users to see their own submissions (unless they're a reviewer)
    if (submission.userId !== userId) {
      throw new ForbiddenError()
    }

    return apiSuccess(submission)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update a submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserId(request)

    if (!userId) {
      throw new UnauthorizedError()
    }

    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    if (submission.userId !== userId) {
      throw new ForbiddenError()
    }

    const { githubUrl, liveUrl, notes } = await parseRequestBody(
      request,
      updateSubmissionSchema
    )

    const updated = await prisma.projectSubmission.update({
      where: { id },
      data: {
        ...(githubUrl && { githubUrl }),
        ...(liveUrl !== undefined && { liveUrl: liveUrl || null }),
        ...(notes !== undefined && { notes: notes || null }),
        // Reset review status when content changes
        status: 'pending',
        feedback: null,
        reviewedAt: null,
        reviewedBy: null,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Delete a submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserId(request)

    if (!userId) {
      throw new UnauthorizedError()
    }

    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      throw new NotFoundError('Submission')
    }

    if (submission.userId !== userId) {
      throw new ForbiddenError()
    }

    await prisma.projectSubmission.delete({
      where: { id },
    })

    return apiSuccess({ message: 'Submission deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
