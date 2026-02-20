/**
 * POST /api/assessments/[slug]/submit
 * Submit assessment answers and get results
 */

import { NextRequest } from 'next/server'
import { ApiError, apiSuccess, handleApiError, NotFoundError, ForbiddenError, HTTP_STATUS } from '@/lib/api-errors'
import { parseRequestBody } from '@/lib/api-errors'
import { submitAssessmentSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import prisma from '@/lib/db'
import { adaptAssessmentQuestion } from '@/lib/type-adapters'
import type { QuestionResult } from '@/types/assessment'

type AnswerValue = string | string[] | number

/**
 * Check if user's answer is correct
 */
function isAnswerCorrect(
  userAnswer: AnswerValue,
  correctAnswer: AnswerValue,
  questionType: string
): boolean {
  // For true/false and single choice, compare directly
  if (questionType === 'TRUE_FALSE' || questionType === 'SINGLE_CHOICE') {
    return String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()
  }

  // For multiple choice, check if all correct answers are selected
  if (questionType === 'MULTIPLE_CHOICE') {
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]

    if (userAnswers.length !== correctAnswers.length) return false

    const sortedUser = userAnswers.map(String).sort()
    const sortedCorrect = correctAnswers.map(String).sort()

    return sortedUser.every((a, i) => a.toLowerCase() === sortedCorrect[i].toLowerCase())
  }

  // For code output and fill blank, compare strings (case-insensitive, trimmed)
  if (questionType === 'CODE_OUTPUT' || questionType === 'FILL_BLANK') {
    return String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()
  }

  return false
}

function mapChoiceValueToOption(value: string | number, options: string[]): string {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < options.length) {
    return options[value]
  }

  return String(value)
}

function normalizeAnswerForQuestion(
  answer: AnswerValue,
  questionType: string,
  options: string[]
): AnswerValue {
  if (questionType === 'SINGLE_CHOICE' || questionType === 'TRUE_FALSE') {
    if (Array.isArray(answer)) {
      const firstValue = answer[0] ?? ''
      return mapChoiceValueToOption(firstValue, options)
    }

    return mapChoiceValueToOption(answer, options)
  }

  if (questionType === 'MULTIPLE_CHOICE') {
    const values = Array.isArray(answer) ? answer : [answer]
    return values.map((value) => mapChoiceValueToOption(value, options))
  }

  if (Array.isArray(answer)) {
    return answer.map((value) => String(value))
  }

  return String(answer)
}

function parseQuestionIds(rawQuestionIds: string): string[] {
  try {
    const parsed = JSON.parse(rawQuestionIds) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

function hasProAccess(subscriptionStatus: string | null | undefined): boolean {
  return (
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing' ||
    subscriptionStatus === 'past_due'
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await parseRequestBody(request, submitAssessmentSchema)

    // Verify user owns this request
    requireOwnership(request, body.userId, 'assessment submission')

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUnique({
        where: { userId: body.userId },
        select: { status: true },
      })

      if (!hasProAccess(subscription?.status)) {
        throw new ForbiddenError('Skill assessments require a Pro subscription')
      }

      // Fetch assessment with questions
      const assessment = await tx.skillAssessment.findUnique({
        where: { slug },
        include: {
          questions: true,
        },
      })

      if (!assessment) {
        throw new NotFoundError('Assessment')
      }

      const attemptSession = await tx.assessmentSession.findUnique({
        where: { id: body.attemptId },
      })

      if (
        !attemptSession ||
        attemptSession.userId !== body.userId ||
        attemptSession.assessmentId !== assessment.id
      ) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Invalid assessment attempt. Please restart the assessment.'
        )
      }

      if (attemptSession.used) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'This assessment attempt has already been submitted.'
        )
      }

      if (attemptSession.expiresAt.getTime() <= Date.now()) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'This assessment attempt has expired. Please start a new attempt.'
        )
      }

      const selectedQuestionIds = parseQuestionIds(attemptSession.questionIds)
      if (selectedQuestionIds.length === 0) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Assessment attempt is invalid. Please restart the assessment.'
        )
      }

      const selectedQuestionIdSet = new Set(selectedQuestionIds)
      for (const answeredQuestionId of Object.keys(body.answers)) {
        if (!selectedQuestionIdSet.has(answeredQuestionId)) {
          throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'Submitted answers do not match this assessment attempt.'
          )
        }
      }

      const adaptedQuestionsById = new Map(
        assessment.questions.map((question) => {
          const adaptedQuestion = adaptAssessmentQuestion(question)
          return [adaptedQuestion.id, adaptedQuestion] as const
        })
      )

      const questions = selectedQuestionIds
        .map((questionId) => adaptedQuestionsById.get(questionId))
        .filter((question): question is NonNullable<typeof question> => question !== undefined)

      if (questions.length !== selectedQuestionIds.length) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'Assessment questions are out of sync. Please restart the assessment.'
        )
      }

      // Calculate score
      const questionResults: QuestionResult[] = []
      let correctCount = 0
      let totalPoints = 0
      let earnedPoints = 0

      for (const question of questions) {
        const userAnswer = body.answers[question.id]
        const normalizedCorrectAnswer = normalizeAnswerForQuestion(
          question.correctAnswer,
          question.questionType,
          question.options
        )
        totalPoints += question.points

        if (userAnswer !== undefined) {
          const normalizedUserAnswer = normalizeAnswerForQuestion(
            userAnswer,
            question.questionType,
            question.options
          )
          const isCorrect = isAnswerCorrect(
            normalizedUserAnswer,
            normalizedCorrectAnswer,
            question.questionType
          )

          if (isCorrect) {
            correctCount++
            earnedPoints += question.points
          }

          questionResults.push({
            questionId: question.id,
            correct: isCorrect,
            userAnswer: normalizedUserAnswer,
            correctAnswer: normalizedCorrectAnswer,
            explanation: question.explanation,
          })
        } else {
          // Question was not answered
          questionResults.push({
            questionId: question.id,
            correct: false,
            userAnswer: 'Not answered',
            correctAnswer: normalizedCorrectAnswer,
            explanation: question.explanation,
          })
        }
      }

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
      const passed = score >= assessment.passingScore

      // XP is awarded only for a learner's first completed attempt on an assessment.
      // This prevents unlimited XP farming from repeated retakes.
      const previousAttemptCount = await tx.assessmentAttempt.count({
        where: {
          userId: body.userId,
          assessmentId: assessment.id,
        },
      })

      let xpAwarded = 0
      if (previousAttemptCount === 0) {
        if (passed) {
          xpAwarded = 50

          if (score >= 90) xpAwarded += 30
          else if (score >= 80) xpAwarded += 20
          else if (score >= 70) xpAwarded += 10

          xpAwarded += 25 // First successful completion bonus
        } else {
          xpAwarded = 10
        }
      }

      const markUsed = await tx.assessmentSession.updateMany({
        where: {
          id: attemptSession.id,
          userId: body.userId,
          used: false,
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      })

      if (markUsed.count !== 1) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'This assessment attempt has already been submitted.'
        )
      }

      const maxTimeSpentSeconds = Math.max(
        0,
        Math.floor((attemptSession.expiresAt.getTime() - attemptSession.startedAt.getTime()) / 1000)
      )
      const normalizedTimeSpent = Math.min(
        Math.max(body.timeSpent ?? 0, 0),
        maxTimeSpentSeconds
      )

      const attempt = await tx.assessmentAttempt.create({
        data: {
          userId: body.userId,
          assessmentId: assessment.id,
          score,
          correctCount,
          totalCount: questions.length,
          timeSpent: normalizedTimeSpent,
          answers: JSON.stringify(body.answers),
          passed,
        },
      })

      if (xpAwarded > 0) {
        await tx.user.update({
          where: { id: body.userId },
          data: {
            points: { increment: xpAwarded },
          },
        })
      }

      return {
        attemptId: attempt.id,
        score,
        passed,
        correctCount,
        totalCount: questions.length,
        passingScore: assessment.passingScore,
        xpAwarded,
        questionResults,
      }
    })

    return apiSuccess({
      ...result,
      skillLevel: getSkillLevel(result.score),
    }, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get skill level based on score
 */
function getSkillLevel(score: number): string {
  if (score >= 95) return 'expert'
  if (score >= 80) return 'advanced'
  if (score >= 50) return 'intermediate'
  return 'beginner'
}
