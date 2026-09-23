import { NextRequest, after } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  ApiError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { givePointSchema } from '@/lib/validations'
import { getAuthenticatedUserId } from '@/lib/authorization'
import { awardHelpingOthersXp } from '@/lib/xp-service'

/**
 * POST /api/points/give
 * Give a community point to someone who helped
 * @body recipientId - The user ID receiving the point
 * @body discussionId - Optional discussion ID
 * @body replyId - Optional reply ID (either discussionId or replyId required)
 * @body reason - Optional reason for giving the point
 * @returns Created point and updated recipient point total
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user (giver)
    const giverId = getAuthenticatedUserId(request)

    // Parse and validate request body
    const body = await parseRequestBody(request, givePointSchema)
    const { recipientId, discussionId, replyId, reason } = body

    // Validation: Can't give points to yourself
    if (giverId === recipientId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'You cannot give a point to yourself'
      )
    }

    // All validation lookups are independent, so run them in parallel; the
    // checks below still report errors in the same order as before.
    const [recipient, discussion, existingDiscussionPoint, reply, existingReplyPoint] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: recipientId },
          select: { id: true, name: true, email: true, points: true },
        }),
        discussionId
          ? prisma.discussion.findUnique({
              where: { id: discussionId },
              select: { userId: true },
            })
          : null,
        discussionId
          ? prisma.communityPoint.findFirst({
              where: {
                giverId,
                discussionId,
              },
            })
          : null,
        replyId
          ? prisma.discussionReply.findUnique({
              where: { id: replyId },
              select: { userId: true },
            })
          : null,
        replyId
          ? prisma.communityPoint.findFirst({
              where: {
                giverId,
                replyId,
              },
            })
          : null,
      ])

    // Verify recipient exists
    if (!recipient) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Recipient user not found')
    }

    // Verify the discussion or reply exists and belongs to the recipient
    if (discussionId) {
      if (!discussion) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Discussion not found')
      }

      if (discussion.userId !== recipientId) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'The discussion does not belong to the specified recipient'
        )
      }

      // Check if point already given for this discussion
      if (existingDiscussionPoint) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'You have already given a point for this discussion'
        )
      }
    }

    if (replyId) {
      if (!reply) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Reply not found')
      }

      if (reply.userId !== recipientId) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'The reply does not belong to the specified recipient'
        )
      }

      // Check if point already given for this reply
      if (existingReplyPoint) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'You have already given a point for this reply'
        )
      }
    }

    // Create the community point and update recipient's total points
    const [point, updatedRecipient] = await prisma.$transaction([
      prisma.communityPoint.create({
        data: {
          recipientId,
          giverId,
          discussionId: discussionId || null,
          replyId: replyId || null,
          reason: reason || null,
        },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          giver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.user.update({
        where: { id: recipientId },
        data: {
          points: {
            increment: 1,
          },
        },
        select: { points: true },
      }),
    ])

    // Award the recipient "helping others" XP so community recognition also
    // contributes to their level. The existing-point checks above ensure each
    // point maps to at most one XP grant. Non-fatal, and the response doesn't
    // depend on it, so it runs after the response is sent.
    after(async () => {
      try {
        await awardHelpingOthersXp(recipientId, point.id)
      } catch (xpError) {
        void xpError
      }
    })

    return apiSuccess(
      {
        pointId: point.id,
        recipient: point.recipient,
        giver: point.giver,
        discussionId: point.discussionId,
        replyId: point.replyId,
        reason: point.reason,
        createdAt: point.createdAt,
        recipientTotalPoints: updatedRecipient?.points || 0,
        message: 'Point given successfully! Thank you for recognizing helpful community members.',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}
