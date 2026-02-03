import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const userId = getUserId(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create course progress for this user
    const progress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
      include: {
        completedLessons: {
          select: {
            id: true,
          },
        },
        quizScores: true,
      },
    })

    // If no progress exists, return empty progress
    if (!progress) {
      // Get total lessons for the course
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

      return NextResponse.json({
        courseId,
        completedLessonIds: [],
        completedCount: 0,
        totalLessons,
        percentComplete: 0,
        quizScores: [],
      })
    }

    // Get total lessons for the course
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

    const completedCount = progress.completedLessons.length
    const percentComplete = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0

    return NextResponse.json({
      courseId,
      completedLessonIds: progress.completedLessons.map(l => l.id),
      completedCount,
      totalLessons,
      percentComplete,
      quizScores: progress.quizScores,
      lastAccessed: progress.lastAccessed,
    })
  } catch (error) {
    void error // Error handled via response
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
