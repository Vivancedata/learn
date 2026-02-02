import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  ValidationError,
} from '@/lib/api-errors'
import { getSolutionsQuerySchema } from '@/lib/validations'
import { getUserId } from '@/lib/auth'

// Type for solution query result
interface SolutionQueryResult {
  id: string
  githubUrl: string
  liveUrl: string | null
  description: string | null
  likesCount: number
  submittedAt: Date
  user: {
    id: string
    name: string | null
    githubUsername: string | null
  }
  likes: { id: string }[] | false
}

/**
 * GET /api/solutions
 * Fetch public project submissions for a lesson
 * @query lessonId - Filter by lesson ID (required)
 * @query page - Page number (default: 1)
 * @query limit - Number of results per page (default: 12, max: 50)
 * @returns Paginated list of public solutions with user info and like counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    // Validate query parameters
    if (!lessonId) {
      throw new ValidationError('lessonId query parameter is required')
    }

    const validatedParams = getSolutionsQuerySchema.parse({
      lessonId,
      page,
      limit,
    })

    const skip = (validatedParams.page - 1) * validatedParams.limit

    // Get the authenticated user ID (if logged in) to check if they liked solutions
    const authenticatedUserId = getUserId(request)

    // Fetch public solutions with user info
    const [solutions, totalCount] = await Promise.all([
      prisma.projectSubmission.findMany({
        where: {
          lessonId: validatedParams.lessonId,
          isPublic: true,
          status: 'approved', // Only show approved solutions
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              githubUsername: true,
            },
          },
          likes: authenticatedUserId
            ? {
                where: {
                  userId: authenticatedUserId,
                },
                select: {
                  id: true,
                },
              }
            : false,
        },
        orderBy: [
          { likesCount: 'desc' },
          { submittedAt: 'desc' },
        ],
        skip,
        take: validatedParams.limit,
      }),
      prisma.projectSubmission.count({
        where: {
          lessonId: validatedParams.lessonId,
          isPublic: true,
          status: 'approved',
        },
      }),
    ])

    // Transform the data to hide sensitive information
    const transformedSolutions = (solutions as SolutionQueryResult[]).map((solution) => ({
      id: solution.id,
      githubUrl: solution.githubUrl,
      liveUrl: solution.liveUrl,
      description: solution.description,
      likesCount: solution.likesCount,
      submittedAt: solution.submittedAt,
      user: {
        id: solution.user.id,
        name: solution.user.name || 'Anonymous',
        githubUsername: solution.user.githubUsername,
      },
      isLikedByUser: authenticatedUserId
        ? Array.isArray(solution.likes) && solution.likes.length > 0
        : false,
    }))

    const totalPages = Math.ceil(totalCount / validatedParams.limit)

    return apiSuccess({
      solutions: transformedSolutions,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        totalCount,
        totalPages,
        hasMore: validatedParams.page < totalPages,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
