import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import { getCourseById } from '@/lib/content'

/**
 * Course content is public — it is the marketing surface for the platform —
 * and changes only when content is republished.
 */
const COURSE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600'

/**
 * GET /api/courses/[courseId]
 * Fetches a single course with its sections and lessons.
 *
 * Exists so the course detail page can ask for the one course it renders.
 * Before this route, that page downloaded the entire catalog from
 * GET /api/courses and filtered it client-side.
 *
 * @param params.courseId - The course ID (a content slug, e.g. `sql-data-analysis`)
 * @returns The course with its full section/lesson structure
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params

    const course = await getCourseById(courseId)

    if (!course) {
      throw new NotFoundError('Course')
    }

    const response = apiSuccess(course)
    response.headers.set('Cache-Control', COURSE_CACHE_CONTROL)

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
