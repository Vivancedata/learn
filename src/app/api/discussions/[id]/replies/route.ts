import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { createReplySchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'

/**
 * POST /api/discussions/[id]/replies
 * Add a reply to a discussion
 * @param id - The discussion ID
 * @body userId - The user ID creating the reply
 * @body content - Reply content
 * @returns Created reply
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const discussionId = id

    // Verify discussion exists
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    })

    if (!discussion) {
      throw new NotFoundError('Discussion')
    }

    // Parse and validate request body
    const body = await parseRequestBody(request, createReplySchema)

    const { userId, content } = body

    // Authorization: Users can only create replies as themselves
    requireOwnership(request, userId, 'discussion reply')

    // Create the reply
    const reply = await prisma.discussionReply.create({
      data: {
        userId,
        discussionId,
        content,
        likes: 0,
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

    return apiSuccess(
      {
        replyId: reply.id,
        content: reply.content,
        user: reply.user,
        likes: reply.likes,
        createdAt: reply.createdAt,
        message: 'Reply added successfully',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/discussions/[id]/replies
 * Get all replies for a discussion
 * @param id - The discussion ID
 * @returns Array of replies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const discussionId = id

    const replies = await prisma.discussionReply.findMany({
      where: { discussionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return apiSuccess({
      replies,
      total: replies.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
