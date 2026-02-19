/**
 * POST /api/assessments/[slug]/submit
 * Submit assessment answers and get results
 */

import { NextRequest } from 'next/server'
import { apiSuccess, handleApiError, NotFoundError, HTTP_STATUS } from '@/lib/api-errors'
import { parseRequestBody } from '@/lib/api-errors'
import { submitAssessmentSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import prisma from '@/lib/db'
import { adaptAssessmentQuestion } from '@/lib/type-adapters'
import type { QuestionResult } from '@/types/assessment'

/**
 * Check if user's answer is correct
 */
function isAnswerCorrect(
  userAnswer: string | string[] | number,
  correctAnswer: string | string[] | number,
  questionType: string
): boolean {
  // For true/false and single choice, compare directly
  if (questionType === 'TRUE_FALSE' || questionType === 'SINGLE_CHOICE') {
    return String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase()
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await parseRequestBody(request, submitAssessmentSchema)

    // Verify user owns this request
    requireOwnership(request, body.userId, 'assessment submission')

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

    // Calculate score
    const questions = assessment.questions.map(adaptAssessmentQuestion)
    const questionResults: QuestionResult[] = []
    let correctCount = 0
    let totalPoints = 0
    let earnedPoints = 0

    for (const question of questions) {
      const userAnswer = body.answers[question.id]
      totalPoints += question.points

      if (userAnswer !== undefined) {
        const isCorrect = isAnswerCorrect(userAnswer, question.correctAnswer, question.questionType)

        if (isCorrect) {
          correctCount++
          earnedPoints += question.points
        }

        questionResults.push({
          questionId: question.id,
          correct: isCorrect,
          userAnswer,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        })
      } else {
        // Question was not answered
        questionResults.push({
          questionId: question.id,
          correct: false,
          userAnswer: 'Not answered',
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        })
      }
    }

    // Calculate percentage score
    const score = Math.round((earnedPoints / totalPoints) * 100)
    const passed = score >= assessment.passingScore

    // Calculate XP to award
    let xpAwarded = 0
    if (passed) {
      // Base XP for passing
      xpAwarded = 50

      // Bonus for high scores
      if (score >= 90) xpAwarded += 30
      else if (score >= 80) xpAwarded += 20
      else if (score >= 70) xpAwarded += 10

      // First-time completion bonus
      const previousAttempts = await prisma.assessmentAttempt.count({
        where: {
          userId: body.userId,
          assessmentId: assessment.id,
          passed: true,
        },
      })

      if (previousAttempts === 0) {
        xpAwarded += 25 // First pass bonus
      }
    } else {
      // Small XP for attempting
      xpAwarded = 10
    }

    // Create attempt record
    // Note: timeSpent should be calculated on the client and passed in
    // For now, we'll use a placeholder
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        userId: body.userId,
        assessmentId: assessment.id,
        score,
        correctCount,
        totalCount: questions.length,
        timeSpent: 0, // This should come from client
        answers: JSON.stringify(body.answers),
        passed,
      },
    })

    // Award XP to user
    if (xpAwarded > 0) {
      await prisma.user.update({
        where: { id: body.userId },
        data: {
          points: { increment: xpAwarded },
        },
      })
    }

    return apiSuccess({
      attemptId: attempt.id,
      score,
      passed,
      correctCount,
      totalCount: questions.length,
      passingScore: assessment.passingScore,
      xpAwarded,
      questionResults,
      skillLevel: getSkillLevel(score),
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
