import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

/**
 * POST /api/solutions/[id]/like
 * Toggle like on a public solution (requires authentication)
 * @param id - Project submission ID
 * @returns Updated like status and count
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: submissionId } = await params

    // Require authentication
    const user = await requireAuth(request)

    // Find the submission
    const submission = await prisma.projectSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        isPublic: true,
        status: true,
        userId: true,
        likesCount: true,
      },
    })

    if (!submission) {
      throw new NotFoundError('Solution')
    }

    // Only allow liking public, approved solutions
    if (!submission.isPublic || submission.status !== 'approved') {
      throw new ForbiddenError('This solution is not available for liking')
    }

    // Prevent users from liking their own solutions
    if (submission.userId === user.userId) {
      throw new ForbiddenError('You cannot like your own solution')
    }

    // Check if the user already liked this submission
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        userId_submissionId: {
          userId: user.userId,
          submissionId,
        },
      },
    })

    let liked: boolean
    let newLikesCount: number

    if (existingLike) {
      // Unlike: Remove the like and decrement count
      await prisma.$transaction([
        prisma.projectLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.projectSubmission.update({
          where: { id: submissionId },
          data: { likesCount: { decrement: 1 } },
        }),
      ])
      liked = false
      newLikesCount = submission.likesCount - 1
    } else {
      // Like: Add the like and increment count
      await prisma.$transaction([
        prisma.projectLike.create({
          data: {
            userId: user.userId,
            submissionId,
          },
        }),
        prisma.projectSubmission.update({
          where: { id: submissionId },
          data: { likesCount: { increment: 1 } },
        }),
      ])
      liked = true
      newLikesCount = submission.likesCount + 1
    }

    return apiSuccess({
      liked,
      likesCount: newLikesCount,
      message: liked ? 'Solution liked' : 'Like removed',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
