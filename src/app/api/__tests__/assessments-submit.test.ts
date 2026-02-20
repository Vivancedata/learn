import { NextRequest } from 'next/server'
import { POST as submitAssessment } from '../assessments/[slug]/submit/route'
import prisma from '@/lib/db'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_ASSESSMENT_ID = 'assessment-1'
const TEST_ATTEMPT_SESSION_ID = '660e8400-e29b-41d4-a716-446655440000'
const TEST_SLUG = 'test-assessment'

function createRequest(body: Record<string, unknown>, userId = TEST_USER_ID) {
  return new NextRequest(`http://localhost:3000/api/assessments/${TEST_SLUG}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-email': 'test@example.com',
      'x-user-name': 'Test User',
    },
    body: JSON.stringify(body),
  })
}

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  },
}))

function createQuestion({
  id = 'question-1',
  questionType = 'SINGLE_CHOICE',
  options = ['3', '4', '5', '6'],
  correctAnswer = 1,
  points = 10,
  explanation = 'Explanation',
}: {
  id?: string
  questionType?: string
  options?: string[]
  correctAnswer?: string | string[] | number
  points?: number
  explanation?: string
} = {}) {
  return {
    id,
    question: `Question ${id}`,
    questionType,
    options: JSON.stringify(options),
    correctAnswer: JSON.stringify(correctAnswer),
    explanation,
    difficulty: 'BEGINNER',
    points,
    codeSnippet: null,
  }
}

function buildTransaction({
  questions = [createQuestion()],
  passingScore = 70,
  assessmentExists = true,
  sessionExists = true,
  sessionUserId = TEST_USER_ID,
  sessionAssessmentId = TEST_ASSESSMENT_ID,
  questionIds,
  sessionUsed = false,
  expiresAt,
  previousAttemptCount = 0,
  markUsedCount = 1,
  subscriptionStatus = 'active',
}: {
  questions?: Array<ReturnType<typeof createQuestion>>
  passingScore?: number
  assessmentExists?: boolean
  sessionExists?: boolean
  sessionUserId?: string
  sessionAssessmentId?: string
  questionIds?: string
  sessionUsed?: boolean
  expiresAt?: Date
  previousAttemptCount?: number
  markUsedCount?: number
  subscriptionStatus?: string | null
} = {}) {
  const assessment = assessmentExists
    ? {
        id: TEST_ASSESSMENT_ID,
        slug: TEST_SLUG,
        name: 'Test Assessment',
        passingScore,
        questions,
      }
    : null

  const attemptSession = sessionExists
    ? {
        id: TEST_ATTEMPT_SESSION_ID,
        userId: sessionUserId,
        assessmentId: sessionAssessmentId,
        questionIds: questionIds ?? JSON.stringify(questions.map((question) => question.id)),
        startedAt: new Date(Date.now() - 30_000),
        expiresAt: expiresAt ?? new Date(Date.now() + 600_000),
        used: sessionUsed,
      }
    : null

  const tx = {
    subscription: {
      findUnique: jest.fn().mockResolvedValue(
        subscriptionStatus ? { status: subscriptionStatus } : null
      ),
    },
    skillAssessment: {
      findUnique: jest.fn().mockResolvedValue(assessment),
    },
    assessmentSession: {
      findUnique: jest.fn().mockResolvedValue(attemptSession),
      updateMany: jest.fn().mockResolvedValue({ count: markUsedCount }),
    },
    assessmentAttempt: {
      count: jest.fn().mockResolvedValue(previousAttemptCount),
      create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
    },
    user: {
      update: jest.fn().mockResolvedValue({}),
    },
  }

  return tx
}

function mockTransaction(tx: ReturnType<typeof buildTransaction>) {
  ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))
}

describe('POST /api/assessments/[slug]/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('grades single-choice answers correctly when correctAnswer is stored as an index', async () => {
    const tx = buildTransaction({
      questions: [
        createQuestion({
          id: 'question-1',
          questionType: 'SINGLE_CHOICE',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          points: 10,
          explanation: '2 + 2 equals 4.',
        }),
      ],
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': '4',
      },
      timeSpent: 30,
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: 'test-assessment' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.score).toBe(100)
    expect(payload.data.passed).toBe(true)
    expect(payload.data.correctCount).toBe(1)
    expect(payload.data.skillLevel).toBe('expert')
    expect(payload.data.xpAwarded).toBe(105)
    expect(payload.data.questionResults[0].userAnswer).toBe('4')
    expect(payload.data.questionResults[0].correctAnswer).toBe('4')

    expect(tx.assessmentAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          score: 100,
          passed: true,
        }),
      })
    )
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER_ID },
      data: { points: { increment: 105 } },
    })
  })

  it('awards advanced skill level for an 80 score and handles true/false array answers', async () => {
    const tx = buildTransaction({
      questions: [
        createQuestion({
          id: 'question-1',
          questionType: 'TRUE_FALSE',
          options: ['False', 'True'],
          correctAnswer: 1,
          points: 8,
        }),
        createQuestion({
          id: 'question-2',
          questionType: 'SINGLE_CHOICE',
          options: ['A', 'B'],
          correctAnswer: 0,
          points: 2,
        }),
      ],
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': ['true'],
        'question-2': 'B',
      },
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.score).toBe(80)
    expect(payload.data.skillLevel).toBe('advanced')
    expect(payload.data.passed).toBe(true)
    expect(payload.data.xpAwarded).toBe(95)
    expect(tx.assessmentAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          score: 80,
          correctCount: 1,
          totalCount: 2,
          timeSpent: 0,
        }),
      })
    )
  })

  it('returns intermediate skill level on a retake and does not award XP', async () => {
    const tx = buildTransaction({
      previousAttemptCount: 2,
      questions: [
        createQuestion({
          id: 'question-1',
          questionType: 'SINGLE_CHOICE',
          options: ['A', 'B'],
          correctAnswer: 0,
          points: 5,
        }),
        createQuestion({
          id: 'question-2',
          questionType: 'SINGLE_CHOICE',
          options: ['C', 'D'],
          correctAnswer: 0,
          points: 5,
        }),
      ],
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': 'A',
      },
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.score).toBe(50)
    expect(payload.data.skillLevel).toBe('intermediate')
    expect(payload.data.questionResults[1].userAnswer).toBe('Not answered')
    expect(payload.data.xpAwarded).toBe(0)
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it('returns beginner skill level and base XP for a failed first attempt', async () => {
    const tx = buildTransaction({
      questions: [
        createQuestion({
          id: 'question-1',
          questionType: 'MULTIPLE_CHOICE',
          options: ['A', 'B', 'C'],
          correctAnswer: ['A', 'C'],
          points: 10,
        }),
      ],
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': 'A',
      },
      timeSpent: 15,
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.score).toBe(0)
    expect(payload.data.passed).toBe(false)
    expect(payload.data.skillLevel).toBe('beginner')
    expect(payload.data.xpAwarded).toBe(10)
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER_ID },
      data: { points: { increment: 10 } },
    })
  })

  it('normalizes MULTIPLE_CHOICE answers when one side is scalar and the other is array', async () => {
    const tx = buildTransaction({
      questions: [
        createQuestion({
          id: 'question-1',
          questionType: 'MULTIPLE_CHOICE',
          options: ['A', 'B', 'C'],
          correctAnswer: 'A',
          points: 10,
        }),
      ],
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': ['A'],
      },
      timeSpent: 5_000,
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.score).toBe(100)
    expect(tx.assessmentAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          // timeSpent is clamped to the session window
          timeSpent: 630,
        }),
      })
    )
  })

  it('handles code/fill-blank comparisons and unknown question types safely', async () => {
    const tx = buildTransaction({
      questions: [
        createQuestion({
          id: 'question-1',
          questionType: 'CODE_OUTPUT',
          correctAnswer: 'Hello',
          options: [],
          points: 5,
        }),
        createQuestion({
          id: 'question-2',
          questionType: 'FILL_BLANK',
          correctAnswer: 'World',
          options: [],
          points: 5,
        }),
        createQuestion({
          id: 'question-3',
          questionType: 'ESSAY',
          correctAnswer: 'Anything',
          options: [],
          points: 1,
        }),
      ],
      passingScore: 50,
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': '  hello ',
        'question-2': 'world',
        'question-3': ['Anything'],
      },
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.correctCount).toBe(2)
    expect(payload.data.questionResults[2].correct).toBe(false)
  })

  it('handles zero-point assessments without dividing by zero', async () => {
    const tx = buildTransaction({
      questions: [
        createQuestion({
          id: 'question-1',
          questionType: 'SINGLE_CHOICE',
          options: ['A', 'B'],
          correctAnswer: 0,
          points: 0,
        }),
      ],
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': 'A',
      },
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.score).toBe(0)
  })

  it('rejects replay submissions when an attempt session is already marked as used', async () => {
    const tx = buildTransaction({
      sessionUsed: true,
      questions: [],
    })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {
        'question-1': '4',
      },
      timeSpent: 30,
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.message).toContain('already been submitted')
  })

  it('returns not found when the assessment does not exist', async () => {
    const tx = buildTransaction({ assessmentExists: false })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: { 'question-1': 'A' },
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })

    expect(response.status).toBe(404)
  })

  it('rejects invalid attempt sessions (missing, wrong user, or wrong assessment)', async () => {
    const missingSessionTx = buildTransaction({ sessionExists: false })
    mockTransaction(missingSessionTx)
    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: { 'question-1': 'A' },
    })

    const missingSessionResponse = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(missingSessionResponse.status).toBe(400)

    const wrongUserTx = buildTransaction({ sessionUserId: '00000000-0000-0000-0000-000000000000' })
    mockTransaction(wrongUserTx)
    const wrongUserResponse = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(wrongUserResponse.status).toBe(400)

    const wrongAssessmentTx = buildTransaction({ sessionAssessmentId: 'different-assessment-id' })
    mockTransaction(wrongAssessmentTx)
    const wrongAssessmentResponse = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(wrongAssessmentResponse.status).toBe(400)
  })

  it('rejects expired attempts, malformed question lists, and answer/question mismatches', async () => {
    const expiredTx = buildTransaction({
      expiresAt: new Date(Date.now() - 1_000),
    })
    mockTransaction(expiredTx)
    const baseRequest = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: { 'question-1': 'A' },
    })

    const expiredResponse = await submitAssessment(baseRequest, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(expiredResponse.status).toBe(400)

    const nonArrayQuestionIdsTx = buildTransaction({
      questionIds: JSON.stringify({ question: 'question-1' }),
    })
    mockTransaction(nonArrayQuestionIdsTx)
    const nonArrayResponse = await submitAssessment(baseRequest, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(nonArrayResponse.status).toBe(400)

    const malformedQuestionIdsTx = buildTransaction({
      questionIds: 'not-json',
    })
    mockTransaction(malformedQuestionIdsTx)
    const malformedResponse = await submitAssessment(baseRequest, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(malformedResponse.status).toBe(400)

    const unexpectedAnswerTx = buildTransaction()
    mockTransaction(unexpectedAnswerTx)
    const unexpectedAnswerRequest = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: { 'unexpected-question': 'A' },
    })
    const unexpectedAnswerResponse = await submitAssessment(unexpectedAnswerRequest, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(unexpectedAnswerResponse.status).toBe(400)

    const outOfSyncQuestionsTx = buildTransaction({
      questionIds: JSON.stringify(['question-1', 'missing-question']),
    })
    mockTransaction(outOfSyncQuestionsTx)
    const outOfSyncResponse = await submitAssessment(baseRequest, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    expect(outOfSyncResponse.status).toBe(400)
  })

  it('rejects conflict when updateMany fails to mark the attempt as used', async () => {
    const tx = buildTransaction({ markUsedCount: 0 })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: { 'question-1': '4' },
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.message).toContain('already been submitted')
  })

  it('uses default resource name and schema validation for malformed payloads', async () => {
    const tx = buildTransaction()
    mockTransaction(tx)

    const badPayloadRequest = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: {},
    })
    const badPayloadResponse = await submitAssessment(badPayloadRequest, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })

    expect(badPayloadResponse.status).toBe(400)
  })

  it('rejects ownership mismatches before accessing the database', async () => {
    const tx = buildTransaction()
    mockTransaction(tx)

    const request = createRequest(
      {
        attemptId: TEST_ATTEMPT_SESSION_ID,
        userId: TEST_USER_ID,
        answers: { 'question-1': 'A' },
      },
      '00000000-0000-0000-0000-000000000000'
    )

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })

    expect(response.status).toBe(403)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('requires a Pro subscription to submit assessments', async () => {
    const tx = buildTransaction({ subscriptionStatus: null })
    mockTransaction(tx)

    const request = createRequest({
      attemptId: TEST_ATTEMPT_SESSION_ID,
      userId: TEST_USER_ID,
      answers: { 'question-1': '4' },
    })

    const response = await submitAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.message).toContain('Pro subscription')
    expect(tx.assessmentAttempt.create).not.toHaveBeenCalled()
  })
})
