import prisma from '@/lib/db'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { adaptCourses } from '@/lib/type-adapters'

/**
 * GET /api/courses
 * Fetches all courses with their sections, lessons, and path information
 * @returns Array of courses with complete structure
 */
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        sections: {
          orderBy: {
            order: 'asc',
          },
          include: {
            lessons: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        path: true,
      },
    })

    const adaptedCourses = adaptCourses(courses)

    return apiSuccess(adaptedCourses)
  } catch (error) {
    return handleApiError(error)
  }
}
