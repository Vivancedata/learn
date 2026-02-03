/**
 * GET /api/assessments/[slug]
 * Get assessment details (without questions)
 * Returns assessment info and user's previous attempts
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import prisma from '@/lib/db'
import { adaptSkillAssessment } from '@/lib/type-adapters'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get authenticated user ID if available
    const userId = request.headers.get('x-user-id')

    // Fetch assessment without questions (questions only returned when starting)
    const assessment = await prisma.skillAssessment.findUnique({
      where: { slug },
    })

    if (!assessment) {
      throw new NotFoundError('Assessment')
    }

    // Get user's previous attempts if authenticated
    let userAttempts: {
      id: string
      score: number
      passed: boolean
      timeSpent: number
      completedAt: Date
    }[] = []
    let bestScore: number | undefined

    if (userId) {
      userAttempts = await prisma.assessmentAttempt.findMany({
        where: {
          userId,
          assessmentId: assessment.id,
        },
        select: {
          id: true,
          score: true,
          passed: true,
          timeSpent: true,
          completedAt: true,
        },
        orderBy: { completedAt: 'desc' },
        take: 10, // Last 10 attempts
      })

      if (userAttempts.length > 0) {
        bestScore = Math.max(...userAttempts.map(a => a.score))
      }
    }

    // Get related course if linked
    let relatedCourse: { id: string; title: string } | undefined
    if (assessment.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: assessment.courseId },
        select: { id: true, title: true },
      })
      if (course) {
        relatedCourse = course
      }
    }

    const adaptedAssessment = adaptSkillAssessment(assessment)

    return apiSuccess({
      assessment: {
        ...adaptedAssessment,
        questions: undefined, // Don't expose questions until assessment starts
      },
      userStats: userId ? {
        attempts: userAttempts.length,
        bestScore,
        history: userAttempts.map(a => ({
          id: a.id,
          score: a.score,
          passed: a.passed,
          timeSpent: a.timeSpent,
          completedAt: a.completedAt.toISOString(),
        })),
      } : null,
      relatedCourse,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
