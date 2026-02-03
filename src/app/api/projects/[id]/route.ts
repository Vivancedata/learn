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
 * Update a project submission (users can only update their own projects)
 * @param id - Project submission ID
 * @body githubUrl - Optional updated GitHub URL (pending only)
 * @body liveUrl - Optional updated live URL (pending only)
 * @body notes - Optional updated notes (pending only)
 * @body isPublic - Optional visibility setting (approved only)
 * @body description - Optional public description (approved only)
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

    // Determine which fields can be updated based on submission status
    const isUpdatingCoreFields =
      body.githubUrl !== undefined ||
      body.liveUrl !== undefined ||
      body.notes !== undefined

    const isUpdatingVisibilityFields =
      body.isPublic !== undefined || body.description !== undefined

    // BUSINESS RULE: Core fields (githubUrl, liveUrl, notes) can only be updated on pending submissions
    if (isUpdatingCoreFields && submission.status !== 'pending') {
      throw new ValidationError(
        `Cannot update project details on ${submission.status} submissions. Only pending submissions can have their details updated.`
      )
    }

    // BUSINESS RULE: Visibility fields can only be updated on approved submissions
    if (isUpdatingVisibilityFields && submission.status !== 'approved') {
      throw new ValidationError(
        'You can only share approved projects publicly. Wait for your project to be approved first.'
      )
    }

    // Build update data - only update fields that are provided
    const updateData: {
      updatedAt: Date
      githubUrl?: string
      liveUrl?: string | null
      notes?: string | null
      isPublic?: boolean
      description?: string | null
    } = {
      updatedAt: new Date(),
    }

    // Core fields (pending only)
    if (body.githubUrl !== undefined) {
      updateData.githubUrl = body.githubUrl
    }

    if (body.liveUrl !== undefined) {
      updateData.liveUrl = body.liveUrl || null
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null
    }

    // Visibility fields (approved only)
    if (body.isPublic !== undefined) {
      updateData.isPublic = body.isPublic
    }

    if (body.description !== undefined) {
      updateData.description = body.description || null
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

    return apiSuccess({
      message: 'Project submission deleted successfully',
      lessonId: submission.lessonId,
      lessonTitle: submission.lesson.title,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
