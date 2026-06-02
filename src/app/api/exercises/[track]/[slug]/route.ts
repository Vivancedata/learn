import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import { getExercise } from '@/lib/exercises'

/**
 * GET /api/exercises/[track]/[slug]
 * Returns a coding exercise's starter code + tests so it can be run and
 * auto-graded in the browser. Public (tryable before signup).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ track: string; slug: string }> }
) {
  try {
    const { track, slug } = await params
    const exercise = await getExercise(track, slug)

    if (!exercise) {
      throw new NotFoundError('Exercise')
    }

    return apiSuccess(exercise)
  } catch (error) {
    return handleApiError(error)
  }
}
