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
 * POST /api/discussions/[id]/like
 * Toggle like on a discussion for the authenticated user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)

    const discussion = await prisma.discussion.findUnique({
      where: { id },
    })

    if (!discussion) {
      throw new NotFoundError('Discussion')
    }

    const existingLike = await prisma.discussionLike.findUnique({
      where: {
        userId_discussionId: {
          userId: user.userId,
          discussionId: id,
        },
      },
    })

    if (existingLike) {
      await prisma.$transaction([
        prisma.discussionLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.discussion.update({
          where: { id },
          data: {
            likes: Math.max(0, discussion.likes - 1),
          },
        }),
      ])

      return apiSuccess(
        { liked: false },
        HTTP_STATUS.OK
      )
    }

    await prisma.$transaction([
      prisma.discussionLike.create({
        data: {
          userId: user.userId,
          discussionId: id,
        },
      }),
      prisma.discussion.update({
        where: { id },
        data: {
          likes: discussion.likes + 1,
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
