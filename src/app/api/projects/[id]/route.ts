import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/lib/api-errors'
import { updateProjectSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth'

/**
 * PATCH /api/projects/[id]
 * Update a project submission (users can only update their own pending projects)
 * @param id - Project submission ID
 * @body githubUrl - Optional updated GitHub URL
 * @body liveUrl - Optional updated live URL
 * @body notes - Optional updated notes
 * @returns Updated project submission
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)

    // Parse and validate request body
    const body = await parseRequestBody(request, updateProjectSchema)

    // Find the project submission
    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!submission) {
      throw new NotFoundError('Project submission')
    }

    // SECURITY: Users can only update their own submissions
    if (submission.userId !== user.userId) {
      throw new ForbiddenError('You can only update your own project submissions')
    }

    // BUSINESS RULE: Can only update pending submissions
    if (submission.status !== 'pending') {
      throw new ValidationError(
        `Cannot update ${submission.status} submissions. Only pending submissions can be updated.`
      )
    }

    // Build update data - only update fields that are provided
    const updateData: {
      updatedAt: Date
      githubUrl?: string
      liveUrl?: string | null
      notes?: string | null
    } = {
      updatedAt: new Date(),
    }

    if (body.githubUrl !== undefined) {
      updateData.githubUrl = body.githubUrl
    }

    if (body.liveUrl !== undefined) {
      updateData.liveUrl = body.liveUrl || null
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null
    }

    // Update the project submission
    const updatedSubmission = await prisma.projectSubmission.update({
      where: { id },
      data: updateData,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    console.log('=================================')
    console.log('PROJECT SUBMISSION UPDATED')
    console.log('=================================')
    console.log('Submission ID:', id)
    console.log('User:', user.email)
    console.log('Lesson:', updatedSubmission.lesson.title)
    console.log('=================================')

    return apiSuccess({
      submission: updatedSubmission,
      message: 'Project submission updated successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project submission (users can only delete their own submissions)
 * @param id - Project submission ID
 * @returns Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)

    // Find the project submission
    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!submission) {
      throw new NotFoundError('Project submission')
    }

    // SECURITY: Users can only delete their own submissions
    if (submission.userId !== user.userId) {
      throw new ForbiddenError('You can only delete your own project submissions')
    }

    // Delete the project submission
    await prisma.projectSubmission.delete({
      where: { id },
    })

    console.log('=================================')
    console.log('PROJECT SUBMISSION DELETED')
    console.log('=================================')
    console.log('Submission ID:', id)
    console.log('User:', user.email)
    console.log('Lesson:', submission.lesson.title)
    console.log('Status:', submission.status)
    console.log('=================================')

    return apiSuccess({
      message: 'Project submission deleted successfully',
      lessonId: submission.lessonId,
      lessonTitle: submission.lesson.title,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
