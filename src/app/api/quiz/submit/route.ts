import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  ValidationError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { submitQuizSchema } from '@/lib/validations'
import { requireOwnership } from '@/lib/authorization'
import { serverAnalytics } from '@/lib/analytics-server'

/**
 * POST /api/quiz/submit
 * Submit quiz answers and calculate score
 * @body userId - The user ID
 * @body courseId - The course ID
 * @body lessonId - The lesson ID with quiz
 * @body answers - Array of answer indices
 * @returns Quiz results with score and feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, submitQuizSchema)

    const { userId, courseId, lessonId, answers } = body

    // Authorization: Users can only submit quizzes for themselves
    requireOwnership(request, userId, 'quiz submission')

    // Get quiz questions for this lesson
    const quizQuestions = await prisma.quizQuestion.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    })

    if (quizQuestions.length === 0) {
      throw new NotFoundError('Quiz questions for this lesson')
    }

    if (answers.length !== quizQuestions.length) {
      throw new ValidationError(
        `Expected ${quizQuestions.length} answers but received ${answers.length}`,
        { expected: quizQuestions.length, received: answers.length }
      )
    }

    // Calculate score
    let correctCount = 0
    const results = quizQuestions.map((question, index) => {
      const userAnswer = answers[index]
      const isCorrect = userAnswer === question.correctAnswer

      if (isCorrect) {
        correctCount++
      }

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      }
    })

    const score = correctCount
    const maxScore = quizQuestions.length
    const percentage = Math.round((score / maxScore) * 100)

    // Find or create course progress
    let courseProgress = await prisma.courseProgress.findFirst({
      where: {
        userId,
        courseId,
      },
    })

    if (!courseProgress) {
      courseProgress = await prisma.courseProgress.create({
        data: {
          userId,
          courseId,
          lastAccessed: new Date(),
        },
      })
    }

    // Save quiz score
    const quizScore = await prisma.quizScore.create({
      data: {
        courseProgressId: courseProgress.id,
        lessonId,
        score,
        maxScore,
      },
    })

    // Update last accessed time
    await prisma.courseProgress.update({
      where: { id: courseProgress.id },
      data: { lastAccessed: new Date() },
    })

    const passed = percentage >= 70

    // Track quiz completion with analytics
    serverAnalytics.trackQuizCompleted(userId, {
      lesson_id: lessonId,
      course_id: courseId,
      score,
      max_score: maxScore,
      percentage,
      passed,
    })

    return apiSuccess(
      {
        quizScoreId: quizScore.id,
        score,
        maxScore,
        percentage,
        passed, // 70% passing grade
        results,
        message:
          passed
            ? 'Congratulations! You passed the quiz.'
            : 'Keep studying and try again.',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/quiz/submit?userId=xxx&lessonId=xxx
 * Get quiz attempt history for a lesson
 * @query userId - The user ID
 * @query lessonId - The lesson ID
 * @returns Array of quiz attempts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const lessonId = searchParams.get('lessonId')

    if (!userId || !lessonId) {
      return apiSuccess({ attempts: [], total: 0 })
    }

    // Authorization: Users can only view their own quiz attempts
    requireOwnership(request, userId, 'quiz attempts')

    // Find course progress for this user
    const courseProgress = await prisma.courseProgress.findFirst({
      where: { userId },
      include: {
        quizScores: {
          where: { lessonId },
          orderBy: { completedAt: 'desc' },
        },
      },
    })

    if (!courseProgress) {
      return apiSuccess({ attempts: [], total: 0 })
    }

    const attempts = courseProgress.quizScores.map((score) => ({
      id: score.id,
      score: score.score,
      maxScore: score.maxScore,
      percentage: Math.round((score.score / score.maxScore) * 100),
      completedAt: score.completedAt,
    }))

    return apiSuccess({
      attempts,
      total: attempts.length,
      bestScore:
        attempts.length > 0
          ? Math.max(...attempts.map((a) => a.percentage))
          : 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
