import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  NotFoundError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

/**
 * POST /api/discussions/replies/[replyId]/like
 * Toggle like on a discussion reply for the authenticated user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const { replyId } = await params
    const user = await requireAuth(request)

    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId },
    })

    if (!reply) {
      throw new NotFoundError('Discussion reply')
    }

    const existingLike = await prisma.discussionReplyLike.findUnique({
      where: {
        userId_discussionReplyId: {
          userId: user.userId,
          discussionReplyId: replyId,
        },
      },
    })

    if (existingLike) {
      await prisma.$transaction([
        prisma.discussionReplyLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.discussionReply.update({
          where: { id: replyId },
          data: {
            likes: Math.max(0, reply.likes - 1),
          },
        }),
      ])

      return apiSuccess(
        { liked: false },
        HTTP_STATUS.OK
      )
    }

    await prisma.$transaction([
      prisma.discussionReplyLike.create({
        data: {
          userId: user.userId,
          discussionReplyId: replyId,
        },
      }),
      prisma.discussionReply.update({
        where: { id: replyId },
        data: {
          likes: reply.likes + 1,
        },
      }),
    ])

    return apiSuccess(
      { liked: true },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
