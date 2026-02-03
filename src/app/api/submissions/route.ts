import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getUserId, requireAuth } from '@/lib/auth'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { createSubmissionSchema, validateBody } from '@/lib/validations'

// GET - List submissions for current user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const courseId = searchParams.get('courseId')

    const where: { userId: string; lessonId?: string } = { userId }
    if (lessonId) where.lessonId = lessonId

    const submissions = await prisma.projectSubmission.findMany({
      where,
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // Filter by courseId if provided
    const filteredSubmissions = courseId
      ? submissions.filter(s => s.lesson.section.course.id === courseId)
      : submissions

    return NextResponse.json(filteredSubmissions)
  } catch (error) {
    void error // Error handled via response
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.API)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      )
    }

    const body = await request.json()
    const validation = validateBody(createSubmissionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { lessonId, githubUrl, liveUrl, notes } = validation.data

    // Check if lesson exists and is a project
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check for existing submission
    const existingSubmission = await prisma.projectSubmission.findFirst({
      where: { userId, lessonId },
    })

    if (existingSubmission) {
      // Update existing submission
      const updated = await prisma.projectSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          githubUrl,
          liveUrl: liveUrl || null,
          notes: notes || null,
          status: 'pending',
          feedback: null,
          reviewedAt: null,
          reviewedBy: null,
          submittedAt: new Date(),
        },
      })
      return NextResponse.json(updated)
    }

    // Create new submission
    const submission = await prisma.projectSubmission.create({
      data: {
        userId,
        lessonId,
        githubUrl,
        liveUrl: liveUrl || null,
        notes: notes || null,
        status: 'pending',
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    void error // Error handled via response
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
