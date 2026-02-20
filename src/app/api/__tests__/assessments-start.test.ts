import { NextRequest } from 'next/server'
import { POST as startAssessment } from '../assessments/[slug]/start/route'
import prisma from '@/lib/db'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_SLUG = 'python-fundamentals'

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    subscription: {
      findUnique: jest.fn(),
    },
    skillAssessment: {
      findUnique: jest.fn(),
    },
    assessmentSession: {
      create: jest.fn(),
    },
  },
}))

function createRequest(userId = TEST_USER_ID) {
  return new NextRequest(`http://localhost:3000/api/assessments/${TEST_SLUG}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-email': 'user@example.com',
      'x-user-name': 'Test User',
    },
    body: JSON.stringify({ userId }),
  })
}

function mockAssessment() {
  return {
    id: 'assessment-1',
    slug: TEST_SLUG,
    name: 'Python Fundamentals',
    passingScore: 70,
    timeLimit: 30,
    totalQuestions: 2,
    questions: [
      {
        id: 'q1',
        question: 'What does len([1,2,3]) return?',
        questionType: 'SINGLE_CHOICE',
        options: JSON.stringify(['2', '3', '4', '5']),
        correctAnswer: JSON.stringify(1),
        explanation: 'len returns the number of items.',
        difficulty: 1,
        points: 10,
        codeSnippet: null,
      },
      {
        id: 'q2',
        question: 'Python is dynamically typed.',
        questionType: 'TRUE_FALSE',
        options: JSON.stringify(['True', 'False']),
        correctAnswer: JSON.stringify(0),
        explanation: 'Python determines type at runtime.',
        difficulty: 1,
        points: 10,
        codeSnippet: null,
      },
    ],
  }
}

describe('POST /api/assessments/[slug]/start', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requires a Pro subscription to start an assessment', async () => {
    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await startAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.message).toContain('Pro subscription')
    expect(prisma.skillAssessment.findUnique).not.toHaveBeenCalled()
  })

  it('starts an assessment for Pro users and stores an attempt session', async () => {
    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue({ status: 'active' })
    ;(prisma.skillAssessment.findUnique as jest.Mock).mockResolvedValue(mockAssessment())
    ;(prisma.assessmentSession.create as jest.Mock).mockResolvedValue({ id: 'attempt-1' })

    const request = createRequest()
    const response = await startAssessment(request, {
      params: Promise.resolve({ slug: TEST_SLUG }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.assessmentSlug).toBe(TEST_SLUG)
    expect(payload.data.questions).toHaveLength(2)
    expect(payload.data.questions[0].correctAnswer).toBeUndefined()
    expect(prisma.assessmentSession.create).toHaveBeenCalled()
  })
})
