import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { handleApiError, UnauthorizedError } from '@/lib/api-errors'

interface UserProgressResponse {
  userId: string
  courses: {
    courseId: string
    courseTitle: string
    totalLessons: number
    completedLessons: number
    progress: number
    lastAccessed: string
  }[]
  overallStats: {
    totalCourses: number
    coursesStarted: number
    coursesCompleted: number
    totalLessons: number
    completedLessons: number
    overallProgress: number
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Get authenticated user ID from middleware-injected headers
    const authenticatedUserId = getUserId(request)
    if (!authenticatedUserId) {
      throw new UnauthorizedError('Authentication required')
    }

    // Get userId from params
    const params = await context.params
    const { userId } = params

    // Authorization check: users can only access their own progress
    if (authenticatedUserId !== userId) {
      throw new UnauthorizedError('You can only access your own progress')
    }

    // Fetch all course progress for the user
    const courseProgressRecords = await prisma.courseProgress.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            sections: {
              include: {
                lessons: true,
              },
            },
          },
        },
        completedLessons: true,
      },
    })

    // Transform progress data
    const courses = courseProgressRecords.map(record => {
      // Count total lessons in the course
      const totalLessons = record.course.sections.reduce(
        (acc, section) => acc + section.lessons.length,
        0
      )

      // Count completed lessons
      const completedLessons = record.completedLessons.length

      // Calculate progress percentage
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        courseId: record.courseId,
        courseTitle: record.course.title,
        totalLessons,
        completedLessons,
        progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
        lastAccessed: record.lastAccessed.toISOString(),
      }
    })

    // Calculate overall stats
    const totalLessons = courses.reduce((acc, course) => acc + course.totalLessons, 0)
    const completedLessons = courses.reduce((acc, course) => acc + course.completedLessons, 0)
    const coursesCompleted = courses.filter(course => course.progress === 100).length
    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    // Get total courses count (all courses in the system)
    const totalCoursesCount = await prisma.course.count()

    const response: UserProgressResponse = {
      userId,
      courses,
      overallStats: {
        totalCourses: totalCoursesCount,
        coursesStarted: courses.length,
        coursesCompleted,
        totalLessons,
        completedLessons,
        overallProgress: Math.round(overallProgress * 100) / 100,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error)
  }
}
