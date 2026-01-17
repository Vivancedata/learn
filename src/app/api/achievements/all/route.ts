import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { ACHIEVEMENTS, getAchievementsByCategory } from '@/lib/achievements'

/**
 * GET /api/achievements/all
 * Get all available achievements
 */
export async function GET(request: NextRequest) {
  try {
    const categorized = getAchievementsByCategory()

    return apiSuccess({
      all: ACHIEVEMENTS,
      byCategory: categorized,
      total: ACHIEVEMENTS.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
