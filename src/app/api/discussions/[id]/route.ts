import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-errors'
import { updateDiscussionSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth'

/**
 * PATCH /api/discussions/[id]
 * Update a discussion (users can only update their own discussions)
 * @param id - Discussion ID
 * @body content - Updated discussion content
 * @returns Updated discussion
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)

    // Parse and validate request body
    const body = await parseRequestBody(request, updateDiscussionSchema)

    // Find the discussion
    const discussion = await prisma.discussion.findUnique({
      where: { id },
    })

    if (!discussion) {
      throw new NotFoundError('Discussion')
    }

    // SECURITY: Users can only update their own discussions
    if (discussion.userId !== user.userId) {
      throw new ForbiddenError('You can only update your own discussions')
    }

    // Update the discussion
    const updatedDiscussion = await prisma.discussion.update({
      where: { id },
      data: {
        content: body.content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return apiSuccess({
      discussion: updatedDiscussion,
      message: 'Discussion updated successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/discussions/[id]
 * Delete a discussion (users can only delete their own discussions)
 * @param id - Discussion ID
 * @returns Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)

    // Find the discussion
    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        replies: true,
      },
    })

    if (!discussion) {
      throw new NotFoundError('Discussion')
    }

    // SECURITY: Users can only delete their own discussions
    if (discussion.userId !== user.userId) {
      throw new ForbiddenError('You can only delete your own discussions')
    }

    // Delete the discussion (cascade will delete replies)
    await prisma.discussion.delete({
      where: { id },
    })

    return apiSuccess({
      message: 'Discussion and all replies deleted successfully',
      deletedReplies: discussion.replies.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
