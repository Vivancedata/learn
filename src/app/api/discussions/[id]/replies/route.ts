import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { createReplySchema, validateBody } from '@/lib/validations'

// POST - Create a reply to a discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: discussionId } = await params
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

    // Check if discussion exists
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = validateBody(createReplySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { content } = validation.data

    const reply = await prisma.discussionReply.create({
      data: {
        userId,
        discussionId,
        content,
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
      id: reply.id,
      userId: reply.userId,
      username: reply.user.name || reply.user.email.split('@')[0],
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      likes: reply.likes,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
