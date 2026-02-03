/**
 * GET /api/assessments/user/[userId]
 * Get user's assessment history and skill profile
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import prisma from '@/lib/db'
import { adaptAssessmentAttempts } from '@/lib/type-adapters'
import { getSkillLevel, type SkillBadge, type SkillLevel } from '@/types/assessment'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Verify user owns this request
    requireOwnership(request, userId, 'assessment history')

    // Fetch all user's attempts with assessment details
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId },
      include: {
        assessment: true,
      },
      orderBy: { completedAt: 'desc' },
    })

    const adaptedAttempts = adaptAssessmentAttempts(attempts)

    // Calculate skill badges (best score per skill area)
    const skillScores: Map<string, {
      bestScore: number
      assessmentName: string
      earnedAt: string
    }> = new Map()

    for (const attempt of adaptedAttempts) {
      if (attempt.assessment) {
        const existing = skillScores.get(attempt.assessment.skillArea)
        if (!existing || attempt.score > existing.bestScore) {
          skillScores.set(attempt.assessment.skillArea, {
            bestScore: attempt.score,
            assessmentName: attempt.assessment.name,
            earnedAt: attempt.completedAt,
          })
        }
      }
    }

    const skills: SkillBadge[] = Array.from(skillScores.entries()).map(([skillArea, data]) => ({
      skillArea,
      level: getSkillLevel(data.bestScore) as SkillLevel,
      score: data.bestScore,
      earnedAt: data.earnedAt,
      assessmentName: data.assessmentName,
    }))

    // Calculate overall stats
    const passedAttempts = adaptedAttempts.filter(a => a.passed)
    const averageScore = adaptedAttempts.length > 0
      ? Math.round(adaptedAttempts.reduce((sum, a) => sum + a.score, 0) / adaptedAttempts.length)
      : 0

    // Group attempts by assessment for history view
    const attemptsByAssessment: Record<string, typeof adaptedAttempts> = {}
    for (const attempt of adaptedAttempts) {
      if (attempt.assessment) {
        const key = attempt.assessment.id
        if (!attemptsByAssessment[key]) {
          attemptsByAssessment[key] = []
        }
        attemptsByAssessment[key].push(attempt)
      }
    }

    return apiSuccess({
      profile: {
        userId,
        skills,
        totalAssessments: Object.keys(attemptsByAssessment).length,
        totalAttempts: adaptedAttempts.length,
        passedCount: passedAttempts.length,
        averageScore,
      },
      recentAttempts: adaptedAttempts.slice(0, 10),
      attemptsByAssessment: Object.entries(attemptsByAssessment).map(([assessmentId, attempts]) => ({
        assessmentId,
        assessmentName: attempts[0]?.assessment?.name || 'Unknown',
        skillArea: attempts[0]?.assessment?.skillArea || 'Unknown',
        bestScore: Math.max(...attempts.map(a => a.score)),
        attemptCount: attempts.length,
        lastAttempt: attempts[0]?.completedAt,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
