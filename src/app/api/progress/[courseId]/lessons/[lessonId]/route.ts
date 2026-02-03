import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getUserId, requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params
    const session = await requireAuth(request)
    const userId = session.userId

    // Verify the lesson exists and belongs to the course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!lesson || lesson.section.course.id !== courseId) {
      return NextResponse.json(
        { error: 'Lesson not found in this course' },
        { status: 404 }
      )
    }

    // Get or create course progress
    let progress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
    })

    if (!progress) {
      progress = await prisma.courseProgress.create({
        data: {
          userId,
          courseId,
        },
      })
    }

    // Check if lesson is already completed
    const existingCompletion = await prisma.courseProgress.findFirst({
      where: {
        id: progress.id,
        completedLessons: {
          some: {
            id: lessonId,
          },
        },
      },
    })

    if (existingCompletion) {
      return NextResponse.json({
        message: 'Lesson already completed',
        lessonId,
        courseId,
      })
    }

    // Mark lesson as complete
    await prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedLessons: {
          connect: { id: lessonId },
        },
        lastAccessed: new Date(),
      },
    })

    // Get updated progress stats
    const updatedProgress = await prisma.courseProgress.findUnique({
      where: { id: progress.id },
      include: {
        completedLessons: {
          select: { id: true },
        },
      },
    })

    // Get total lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    })

    const totalLessons = course?.sections.reduce(
      (acc, section) => acc + section.lessons.length,
      0
    ) || 0

    const completedCount = updatedProgress?.completedLessons.length || 0
    const percentComplete = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0

    return NextResponse.json({
      message: 'Lesson marked as complete',
      lessonId,
      courseId,
      completedCount,
      totalLessons,
      percentComplete,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    void error // Error handled via response
    return NextResponse.json(
      { error: 'Failed to mark lesson as complete' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params
    const userId = getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get course progress
    const progress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
    })

    if (!progress) {
      return NextResponse.json(
        { error: 'No progress found' },
        { status: 404 }
      )
    }

    // Remove lesson from completed
    await prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedLessons: {
          disconnect: { id: lessonId },
        },
      },
    })

    return NextResponse.json({
      message: 'Lesson marked as incomplete',
      lessonId,
      courseId,
    })
  } catch (error) {
    void error // Error handled via response
    return NextResponse.json(
      { error: 'Failed to mark lesson as incomplete' },
      { status: 500 }
    )
  }
}
