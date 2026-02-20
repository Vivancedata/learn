/**
 * POST /api/assessments/[slug]/start
 * Start an assessment attempt
 * Returns shuffled questions and attempt metadata
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import { parseRequestBody } from '@/lib/api-errors'
import { startAssessmentSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import prisma from '@/lib/db'
import { adaptAssessmentQuestion } from '@/lib/type-adapters'
import type { AssessmentQuestion } from '@/types/assessment'

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Remove correct answer from question for client
 */
function sanitizeQuestionForClient(question: AssessmentQuestion): Omit<AssessmentQuestion, 'correctAnswer'> & { correctAnswer: undefined } {
  const { correctAnswer: _correctAnswer, ...rest } = question
  return { ...rest, correctAnswer: undefined }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await parseRequestBody(request, startAssessmentSchema)

    // Verify user owns this request
    requireOwnership(request, body.userId, 'assessment attempt')

    // Fetch assessment with questions
    const assessment = await prisma.skillAssessment.findUnique({
      where: { slug },
      include: {
        questions: true,
      },
    })

    if (!assessment) {
      throw new NotFoundError('Assessment')
    }

    // Shuffle questions and select the required number
    const allQuestions = assessment.questions.map(adaptAssessmentQuestion)
    const shuffledQuestions = shuffleArray(allQuestions)
    const selectedQuestions = shuffledQuestions.slice(0, assessment.totalQuestions)

    // Also shuffle options within each question (except for code output and fill blank)
    const questionsForClient = selectedQuestions.map(q => {
      let shuffledOptions = q.options
      if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
        // Need to track the correct answer index after shuffle
        shuffledOptions = shuffleArray(q.options)
      }

      // Remove correct answer from response
      return sanitizeQuestionForClient({
        ...q,
        options: shuffledOptions,
      })
    })

    // Create and persist a one-time attempt session so submit can be verified server-side.
    const attemptId = crypto.randomUUID()
    const startedAt = new Date()
    const expiresAt = new Date(startedAt.getTime() + assessment.timeLimit * 60 * 1000 + 30_000)

    await prisma.assessmentSession.create({
      data: {
        id: attemptId,
        userId: body.userId,
        assessmentId: assessment.id,
        questionIds: JSON.stringify(selectedQuestions.map((question) => question.id)),
        startedAt,
        expiresAt,
      },
    })

    return apiSuccess({
      attemptId,
      assessmentId: assessment.id,
      assessmentSlug: assessment.slug,
      name: assessment.name,
      timeLimit: assessment.timeLimit,
      passingScore: assessment.passingScore,
      totalQuestions: assessment.totalQuestions,
      startedAt: startedAt.toISOString(),
      questions: questionsForClient,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
