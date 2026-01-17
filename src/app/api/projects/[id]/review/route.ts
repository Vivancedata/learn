import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
} from '@/lib/api-errors'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'

// Updated schema without reviewedBy (gets it from auth)
const reviewProjectSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  feedback: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(2000, 'Feedback must be less than 2000 characters'),
})

/**
 * POST /api/projects/[id]/review
 * Review and provide feedback on a project submission
 * SECURITY: Only instructors and admins can review projects
 * @param id - The project submission ID
 * @body status - 'approved' or 'rejected'
 * @body feedback - Review feedback
 * @returns Updated project submission
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Require instructor or admin role
    const reviewer = await requireRole(request, ['instructor', 'admin'])

    const { id } = await params
    const submissionId = id

    // Parse and validate request body
    const body = await parseRequestBody(request, reviewProjectSchema)

    const { status, feedback } = body

    // Find the submission
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      throw new NotFoundError('Project submission')
    }

    // Update submission with review
    const updatedSubmission = await prisma.projectSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        feedback,
        reviewedBy: reviewer.userId,  // From authenticated user
        reviewedAt: new Date(),
      },
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
    })

    return apiSuccess({
      submissionId: updatedSubmission.id,
      status: updatedSubmission.status,
      feedback: updatedSubmission.feedback,
      reviewedAt: updatedSubmission.reviewedAt,
      message: `Project ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
