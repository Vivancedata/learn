/**
 * GET /api/assessments
 * List all skill assessments with optional filtering
 * Returns assessments with user's best score if authenticated
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { getAssessmentsQuerySchema } from '@/lib/validations'
import prisma from '@/lib/db'
import { adaptSkillAssessments } from '@/lib/type-adapters'
import type { AssessmentWithUserScore } from '@/types/assessment'

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const query = getAssessmentsQuerySchema.parse(searchParams)

    // Get authenticated user ID if available
    const userId = request.headers.get('x-user-id')

    // Build where clause for filtering
    const where: {
      skillArea?: string
      difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
    } = {}

    if (query.skillArea) {
      where.skillArea = query.skillArea
    }
    if (query.difficulty) {
      where.difficulty = query.difficulty
    }

    // Fetch assessments with pagination
    const [assessments, total] = await Promise.all([
      prisma.skillAssessment.findMany({
        where,
        orderBy: [
          { difficulty: 'asc' },
          { name: 'asc' },
        ],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.skillAssessment.count({ where }),
    ])

    // If user is authenticated, get their best scores
    let userScores: Map<string, { bestScore: number; attempts: number; lastAttempt: Date }> = new Map()

    if (userId) {
      const attempts = await prisma.assessmentAttempt.findMany({
        where: {
          userId,
          assessmentId: { in: assessments.map(a => a.id) },
        },
        select: {
          assessmentId: true,
          score: true,
          completedAt: true,
        },
      })

      // Group by assessment and calculate best score and attempt count
      attempts.forEach(attempt => {
        const existing = userScores.get(attempt.assessmentId)
        if (!existing) {
          userScores.set(attempt.assessmentId, {
            bestScore: attempt.score,
            attempts: 1,
            lastAttempt: attempt.completedAt,
          })
        } else {
          userScores.set(attempt.assessmentId, {
            bestScore: Math.max(existing.bestScore, attempt.score),
            attempts: existing.attempts + 1,
            lastAttempt: attempt.completedAt > existing.lastAttempt
              ? attempt.completedAt
              : existing.lastAttempt,
          })
        }
      })
    }

    // Adapt assessments and add user scores
    const adaptedAssessments = adaptSkillAssessments(assessments)
    const assessmentsWithScores: AssessmentWithUserScore[] = adaptedAssessments.map(assessment => {
      const userScore = userScores.get(assessment.id)
      return {
        ...assessment,
        userBestScore: userScore?.bestScore,
        userAttempts: userScore?.attempts,
        lastAttemptDate: userScore?.lastAttempt?.toISOString(),
      }
    })

    // Get unique skill areas for filtering
    const skillAreas = await prisma.skillAssessment.groupBy({
      by: ['skillArea'],
      _count: true,
    })

    return apiSuccess({
      assessments: assessmentsWithScores,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      filters: {
        skillAreas: skillAreas.map(s => ({
          name: s.skillArea,
          count: s._count,
        })),
        difficulties: ['Beginner', 'Intermediate', 'Advanced'],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
