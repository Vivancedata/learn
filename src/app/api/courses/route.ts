import prisma from '@/lib/db'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { adaptCourseCatalog } from '@/lib/type-adapters'

/**
 * The catalog is identical for every visitor and changes only when content is
 * republished, so it is safe to serve from the edge cache and revalidate in
 * the background.
 */
const CATALOG_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600'

/**
 * GET /api/courses
 * Lists every course with the fields the catalog and dashboard render:
 * card metadata plus a section/lesson outline (titles only).
 *
 * Lesson bodies, transcripts and video metadata are deliberately NOT selected.
 * They are only needed by the course detail and lesson pages, which fetch them
 * from GET /api/courses/[courseId] and GET /api/lessons/[id]. Including them
 * here made this endpoint return ~520KB on every catalog view.
 *
 * @returns Array of course catalog entries
 */
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        durationHours: true,
        pathId: true,
        prerequisites: true,
        learningOutcomes: true,
        sections: {
          orderBy: {
            order: 'asc',
          },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            lessons: {
              orderBy: {
                createdAt: 'asc',
              },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
              },
            },
          },
        },
      },
    })

    const response = apiSuccess(adaptCourseCatalog(courses))
    response.headers.set('Cache-Control', CATALOG_CACHE_CONTROL)

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
