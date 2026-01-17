import prisma from '@/lib/db'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { adaptPaths } from '@/lib/type-adapters'

/**
 * GET /api/paths
 * Fetches all learning paths with their associated courses
 * @returns Array of learning paths with course IDs
 */
export async function GET() {
  try {
    const paths = await prisma.path.findMany({
      include: {
        courses: true,
      },
    })

    const adaptedPaths = adaptPaths(paths)

    return apiSuccess(adaptedPaths)
  } catch (error) {
    return handleApiError(error)
  }
}
