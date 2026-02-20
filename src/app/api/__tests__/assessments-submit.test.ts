import { NextRequest } from 'next/server'
import { POST as submitAssessment } from '../assessments/[slug]/submit/route'
import prisma from '@/lib/db'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_ASSESSMENT_ID = 'assessment-1'
const TEST_ATTEMPT_SESSION_ID = '660e8400-e29b-41d4-a716-446655440000'

function createRequest(body: Record<string, unknown>, userId = TEST_USER_ID) {
  return new NextRequest('http://localhost:3000/api/assessments/test/submit', {
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

describe('POST /api/assessments/[slug]/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('grades single-choice answers correctly when correctAnswer is stored as an index', async () => {
    const now = new Date()

    const tx = {
      skillAssessment: {
        findUnique: jest.fn().mockResolvedValue({
          id: TEST_ASSESSMENT_ID,
          slug: 'test-assessment',
          name: 'Test Assessment',
          passingScore: 70,
          questions: [
            {
              id: 'question-1',
              question: 'What is 2 + 2?',
              questionType: 'SINGLE_CHOICE',
              options: JSON.stringify(['3', '4', '5', '6']),
              correctAnswer: JSON.stringify(1),
              explanation: '2 + 2 equals 4.',
              difficulty: 'BEGINNER',
              points: 10,
              codeSnippet: null,
            },
          ],
        }),
      },
      assessmentSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: TEST_ATTEMPT_SESSION_ID,
          userId: TEST_USER_ID,
          assessmentId: TEST_ASSESSMENT_ID,
          questionIds: JSON.stringify(['question-1']),
          startedAt: new Date(now.getTime() - 30_000),
          expiresAt: new Date(now.getTime() + 600_000),
          used: false,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      assessmentAttempt: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'attempt-1' }),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
    }

    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))

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
    expect(tx.user.update).toHaveBeenCalledTimes(1)
  })

  it('rejects replay submissions when an attempt session is already marked as used', async () => {
    const now = new Date()

    const tx = {
      skillAssessment: {
        findUnique: jest.fn().mockResolvedValue({
          id: TEST_ASSESSMENT_ID,
          slug: 'test-assessment',
          name: 'Test Assessment',
          passingScore: 70,
          questions: [],
        }),
      },
      assessmentSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: TEST_ATTEMPT_SESSION_ID,
          userId: TEST_USER_ID,
          assessmentId: TEST_ASSESSMENT_ID,
          questionIds: JSON.stringify(['question-1']),
          startedAt: new Date(now.getTime() - 30_000),
          expiresAt: new Date(now.getTime() + 600_000),
          used: true,
        }),
      },
    }

    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => callback(tx))

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

    expect(response.status).toBe(409)
    expect(payload.message).toContain('already been submitted')
  })
})
