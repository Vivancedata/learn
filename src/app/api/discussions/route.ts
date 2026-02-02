import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { createDiscussionSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'

/**
 * POST /api/discussions
 * Create a new discussion
 * @body userId - The user ID creating the discussion
 * @body content - Discussion content
 * @body courseId - Optional course ID
 * @body lessonId - Optional lesson ID (either courseId or lessonId required)
 * @returns Created discussion
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, createDiscussionSchema)

    const { userId, content, courseId, lessonId } = body

    // Authorization: Users can only create discussions as themselves
    requireOwnership(request, userId, 'discussion')

    // Create the discussion
    const discussion = await prisma.discussion.create({
      data: {
        userId,
        content,
        courseId: courseId || null,
        lessonId: lessonId || null,
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
        discussionId: discussion.id,
        content: discussion.content,
        user: discussion.user,
        likes: discussion.likes,
        createdAt: discussion.createdAt,
        message: 'Discussion created successfully',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/discussions?courseId=xxx&lessonId=xxx
 * Get discussions for a course or lesson
 * @query courseId - Filter by course ID (optional)
 * @query lessonId - Filter by lesson ID (optional)
 * @query limit - Maximum number of discussions to return (default: 50)
 * @returns Array of discussions with replies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Prisma.DiscussionWhereInput = {}
    if (courseId) where.courseId = courseId
    if (lessonId) where.lessonId = lessonId

    const discussions = await prisma.discussion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            points: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                points: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return apiSuccess({
      discussions,
      total: discussions.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
