import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  NotFoundError,
} from '@/lib/api-errors'

// Type for community point with included relations
interface PointWithRelations {
  id: string
  reason: string | null
  createdAt: Date
  giver: {
    id: string
    name: string | null
    email: string
  }
  discussion: {
    id: string
    content: string
    courseId: string | null
    lessonId: string | null
  } | null
  reply: {
    id: string
    content: string
    discussionId: string
  } | null
}

/**
 * GET /api/points/user/[userId]
 * Get a user's point history and total points
 * @param userId - The user ID to get points for
 * @query limit - Number of recent point receipts to return (default: 20)
 * @returns User's total points and recent point history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        showOnLeaderboard: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Get recent points received
    const pointsReceived = await prisma.communityPoint.findMany({
      where: { recipientId: userId },
      include: {
        giver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        discussion: {
          select: {
            id: true,
            content: true,
            courseId: true,
            lessonId: true,
          },
        },
        reply: {
          select: {
            id: true,
            content: true,
            discussionId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Get points given by this user
    const pointsGiven = await prisma.communityPoint.count({
      where: { giverId: userId },
    })

    // Calculate helper badge level
    const badgeLevel = getHelperBadge(user.points)

    return apiSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        totalPoints: user.points,
        pointsGiven,
        showOnLeaderboard: user.showOnLeaderboard,
        badge: badgeLevel,
      },
      recentPointsReceived: (pointsReceived as PointWithRelations[]).map((point) => ({
        id: point.id,
        giver: {
          id: point.giver.id,
          name: point.giver.name || point.giver.email.split('@')[0],
        },
        reason: point.reason,
        createdAt: point.createdAt,
        context: point.discussion
          ? {
              type: 'discussion' as const,
              id: point.discussion.id,
              preview: truncateContent(point.discussion.content, 100),
              courseId: point.discussion.courseId,
              lessonId: point.discussion.lessonId,
            }
          : point.reply
            ? {
                type: 'reply' as const,
                id: point.reply.id,
                preview: truncateContent(point.reply.content, 100),
                discussionId: point.reply.discussionId,
              }
            : null,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Determine helper badge based on points
 */
function getHelperBadge(points: number): {
  level: string
  name: string
  minPoints: number
} | null {
  if (points >= 40) {
    return { level: 'super', name: 'Super Helper', minPoints: 40 }
  }
  if (points >= 10) {
    return { level: 'helper', name: 'Community Helper', minPoints: 10 }
  }
  return null
}

/**
 * Truncate content to a specified length
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trim() + '...'
}
