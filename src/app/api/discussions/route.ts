import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { createDiscussionSchema, validateBody } from '@/lib/validations'

// Helper to get display username
function getUsername(user: { name: string | null; email: string }): string {
  return user.name || user.email.split('@')[0]
}

// GET - List discussions (with pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: { courseId?: string; lessonId?: string } = {}
    if (courseId) where.courseId = courseId
    if (lessonId) where.lessonId = lessonId

    const [discussions, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.discussion.count({ where }),
    ])

    const transformed = discussions.map(d => ({
      id: d.id,
      userId: d.userId,
      username: getUsername(d.user),
      content: d.content,
      createdAt: d.createdAt.toISOString(),
      likes: d.likes,
      replies: d.replies.map(r => ({
        id: r.id,
        userId: r.userId,
        username: getUsername(r.user),
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        likes: r.likes,
      })),
    }))

    return NextResponse.json({
      data: transformed,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching discussions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    )
  }
}

// POST - Create a new discussion
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()

    // Rate limiting
    const identifier = getClientIdentifier(request, userId)
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.mutation)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      )
    }

    const body = await request.json()
    const validation = validateBody(createDiscussionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { content, courseId, lessonId } = validation.data

    const discussion = await prisma.discussion.create({
      data: {
        userId,
        content,
        courseId: courseId || null,
        lessonId: lessonId || null,
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

    return NextResponse.json({
      id: discussion.id,
      userId: discussion.userId,
      username: getUsername(discussion.user),
      content: discussion.content,
      createdAt: discussion.createdAt.toISOString(),
      likes: discussion.likes,
      replies: [],
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating discussion:', error)
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    )
  }
}
