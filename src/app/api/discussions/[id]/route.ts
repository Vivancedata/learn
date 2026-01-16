import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { updateDiscussionSchema, validateBody } from '@/lib/validations'

// Helper to get display username
function getUsername(user: { name: string | null; email: string }): string {
  return user.name || user.email.split('@')[0]
}

// GET - Get a specific discussion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const discussion = await prisma.discussion.findUnique({
      where: { id },
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
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: discussion.id,
      userId: discussion.userId,
      username: getUsername(discussion.user),
      content: discussion.content,
      createdAt: discussion.createdAt.toISOString(),
      likes: discussion.likes,
      replies: discussion.replies.map(r => ({
        id: r.id,
        userId: r.userId,
        username: getUsername(r.user),
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        likes: r.likes,
      })),
    })
  } catch (error) {
    console.error('Error fetching discussion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussion' },
      { status: 500 }
    )
  }
}

// PATCH - Update a discussion (like or edit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await requireAuth()

    const discussion = await prisma.discussion.findUnique({
      where: { id },
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = validateBody(updateDiscussionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { content, like } = validation.data

    // Handle like action - properly track likes per user
    if (like !== undefined) {
      // Check if user has already liked this discussion
      const existingLike = await prisma.discussionLike.findUnique({
        where: {
          userId_discussionId: {
            userId,
            discussionId: id,
          },
        },
      })

      if (like) {
        // User wants to like
        if (existingLike) {
          // Already liked - return current likes without change
          return NextResponse.json({ likes: discussion.likes, alreadyLiked: true })
        }

        // Add like and increment counter in a transaction
        const [, updated] = await prisma.$transaction([
          prisma.discussionLike.create({
            data: { userId, discussionId: id },
          }),
          prisma.discussion.update({
            where: { id },
            data: { likes: { increment: 1 } },
          }),
        ])
        return NextResponse.json({ likes: updated.likes, liked: true })
      } else {
        // User wants to unlike
        if (!existingLike) {
          // Hasn't liked - return current likes without change
          return NextResponse.json({ likes: discussion.likes, alreadyUnliked: true })
        }

        // Remove like and decrement counter in a transaction
        const [, updated] = await prisma.$transaction([
          prisma.discussionLike.delete({
            where: {
              userId_discussionId: {
                userId,
                discussionId: id,
              },
            },
          }),
          prisma.discussion.update({
            where: { id },
            data: { likes: { decrement: 1 } },
          }),
        ])
        return NextResponse.json({ likes: updated.likes, unliked: true })
      }
    }

    // Handle content edit (only owner can edit)
    if (content !== undefined) {
      if (discussion.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const updated = await prisma.discussion.update({
        where: { id },
        data: { content },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error updating discussion:', error)
    return NextResponse.json(
      { error: 'Failed to update discussion' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a discussion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await requireAuth()

    const discussion = await prisma.discussion.findUnique({
      where: { id },
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    if (discussion.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete likes, then replies, then discussion
    await prisma.$transaction([
      prisma.discussionLike.deleteMany({
        where: { discussionId: id },
      }),
      prisma.discussionReplyLike.deleteMany({
        where: {
          reply: { discussionId: id },
        },
      }),
      prisma.discussionReply.deleteMany({
        where: { discussionId: id },
      }),
      prisma.discussion.delete({
        where: { id },
      }),
    ])

    return NextResponse.json({ message: 'Discussion deleted' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error deleting discussion:', error)
    return NextResponse.json(
      { error: 'Failed to delete discussion' },
      { status: 500 }
    )
  }
}
