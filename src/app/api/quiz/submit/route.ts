import { NextRequest, after } from 'next/server'
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
import { awardQuizXp, hasReceivedXpFor } from '@/lib/xp-service'
import { recordActivityAndUpdateStreak } from '@/lib/streak-service'
import { runAchievementsCheck } from '@/lib/achievements-service'
import { serverAnalytics, flushAnalytics } from '@/lib/analytics-server'

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

    // Quiz questions and the user's course progress are independent lookups
    const [quizQuestions, existingProgress] = await Promise.all([
      prisma.quizQuestion.findMany({
        where: { lessonId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.courseProgress.findFirst({
        where: {
          userId,
          courseId,
        },
      }),
    ])

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
    let courseProgress = existingProgress

    if (!courseProgress) {
      courseProgress = await prisma.courseProgress.create({
        data: {
          userId,
          courseId,
          lastAccessed: new Date(),
        },
      })
    }

    // Save quiz score and update last accessed time
    const [quizScore] = await Promise.all([
      prisma.quizScore.create({
        data: {
          courseProgressId: courseProgress.id,
          lessonId,
          score,
          maxScore,
        },
      }),
      prisma.courseProgress.update({
        where: { id: courseProgress.id },
        data: { lastAccessed: new Date() },
      }),
    ])

    const passed = percentage >= 70

    // Award XP + streak and evaluate achievements server-side. These are
    // side effects of a real quiz completion and must never fail the
    // submission, so they are best-effort. XP is deduplicated per lesson.
    let xpAwarded = 0
    let leveledUp = false
    let gamificationFailed = false
    try {
      if (passed) {
        const [passAwarded, perfectAwarded] = await Promise.all([
          hasReceivedXpFor(userId, 'QUIZ_PASS', lessonId),
          hasReceivedXpFor(userId, 'QUIZ_PERFECT', lessonId),
        ])
        const alreadyAwarded = passAwarded || perfectAwarded

        if (!alreadyAwarded) {
          const xpResult = await awardQuizXp(userId, lessonId, percentage)
          if (xpResult) {
            xpAwarded = xpResult.xpAwarded
            leveledUp = xpResult.leveledUp
          }
        }

        await recordActivityAndUpdateStreak(userId, {
          quizzesTaken: 1,
          xpEarned: xpAwarded,
        })
      }
    } catch (gamificationError) {
      gamificationFailed = true
      void gamificationError
    }

    // The response doesn't use the achievements result, so evaluate them
    // after responding (still skipped if the XP/streak step above failed).
    if (!gamificationFailed) {
      after(async () => {
        try {
          await runAchievementsCheck(userId)
        } catch (achError) {
          void achError
        }
      })
    }

    // Track quiz completion with analytics
    serverAnalytics.trackQuizCompleted(userId, {
      lesson_id: lessonId,
      course_id: courseId,
      score,
      max_score: maxScore,
      percentage,
      passed,
    })

    // posthog-node batches events; flush them before the function is frozen
    after(flushAnalytics)

    return apiSuccess(
      {
        quizScoreId: quizScore.id,
        score,
        maxScore,
        percentage,
        passed, // 70% passing grade
        xpAwarded,
        leveledUp,
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
