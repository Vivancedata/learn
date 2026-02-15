import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  validateParams,
} from '@/lib/api-errors'
import { xpUserParamsSchema, xpHistoryQuerySchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import { getXpHistory } from '@/lib/xp-service'
import type { XpSource } from '@/lib/xp-config'

/**
 * GET /api/xp/history/[userId]
 * Get paginated XP transaction history for a user
 * @param userId - The user ID from URL params
 * @query page - Page number (default 1)
 * @query limit - Results per page (default 10, max 100)
 * @query source - Filter by XP source type (optional)
 * @returns Paginated list of XP transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    validateParams({ userId }, xpUserParamsSchema)

    // Authorization: Users can only view their own XP history
    requireOwnership(request, userId, 'XP history')

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      source: searchParams.get('source') || undefined,
    }

    const validatedQuery = xpHistoryQuerySchema.parse(queryParams)

    const history = await getXpHistory(userId, {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      source: validatedQuery.source as XpSource | undefined,
    })

    return apiSuccess({
      transactions: history.transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        source: t.source,
        sourceId: t.sourceId,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      pagination: {
        total: history.total,
        page: history.page,
        limit: history.limit,
        totalPages: history.totalPages,
        hasMore: history.page < history.totalPages,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
