import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { listExercises } from '@/lib/exercises'

/**
 * GET /api/exercises
 * List all available coding exercises, grouped by track. Public.
 */
export async function GET(_request: NextRequest) {
  try {
    const tracks = await listExercises()
    return apiSuccess(tracks)
  } catch (error) {
    return handleApiError(error)
  }
}
