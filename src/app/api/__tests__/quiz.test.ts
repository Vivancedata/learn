import { NextRequest } from 'next/server'
import { POST as submitQuiz, GET as getQuizAttempts } from '../quiz/submit/route'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    quizQuestion: {
      findMany: jest.fn(),
    },
    courseProgress: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    quizScore: {
      create: jest.fn(),
    },
  },
}))

// Mock analytics to avoid side effects in tests
jest.mock('@/lib/analytics-server', () => ({
  serverAnalytics: {
    trackQuizCompleted: jest.fn(),
    track: jest.fn(),
  },
}))

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_COURSE_ID = 'python-basics'
const TEST_LESSON_ID = '550e8400-e29b-41d4-a716-446655440001'

// Helper to create an authorized request with body
function createAuthorizedRequest(url: string, body: unknown, method = 'POST'): NextRequest {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': TEST_USER_ID,
      'x-user-email': 'test@example.com',
    },
  })
}

describe('Quiz API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/quiz/submit', () => {
    const mockQuizQuestions = [
      {
        id: 'q-1',
        question: 'What is 2 + 2?',
        correctAnswer: 2, // index 2 → "4"
        explanation: 'Basic math',
        lessonId: TEST_LESSON_ID,
        createdAt: new Date(),
        options: JSON.stringify(['1', '2', '4', '8']),
      },
      {
        id: 'q-2',
        question: 'What is the capital of France?',
        correctAnswer: 0, // index 0 → "Paris"
        explanation: 'Paris is the capital',
        lessonId: TEST_LESSON_ID,
        createdAt: new Date(),
        options: JSON.stringify(['Paris', 'London', 'Berlin', 'Madrid']),
      },
    ]

    it('should successfully submit quiz and return score', async () => {
      const mockProgress = { id: 'progress-1', userId: TEST_USER_ID, courseId: TEST_COURSE_ID }
      const mockQuizScore = {
        id: 'qs-1',
        courseProgressId: 'progress-1',
        lessonId: TEST_LESSON_ID,
        score: 2,
        maxScore: 2,
        completedAt: new Date(),
      }

      ;(prisma.quizQuestion.findMany as jest.Mock).mockResolvedValue(mockQuizQuestions)
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(mockProgress)
      ;(prisma.quizScore.create as jest.Mock).mockResolvedValue(mockQuizScore)
      ;(prisma.courseProgress.update as jest.Mock).mockResolvedValue(mockProgress)

      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lessonId: TEST_LESSON_ID,
        answers: [2, 0], // both correct
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.score).toBe(2)
      expect(data.data.maxScore).toBe(2)
      expect(data.data.percentage).toBe(100)
      expect(data.data.passed).toBe(true)
      expect(data.data.results).toHaveLength(2)
    })

    it('should return passed=false when score is below 70%', async () => {
      const mockProgress = { id: 'progress-1', userId: TEST_USER_ID, courseId: TEST_COURSE_ID }
      const mockQuizScore = {
        id: 'qs-1',
        courseProgressId: 'progress-1',
        lessonId: TEST_LESSON_ID,
        score: 0,
        maxScore: 2,
        completedAt: new Date(),
      }

      ;(prisma.quizQuestion.findMany as jest.Mock).mockResolvedValue(mockQuizQuestions)
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(mockProgress)
      ;(prisma.quizScore.create as jest.Mock).mockResolvedValue(mockQuizScore)
      ;(prisma.courseProgress.update as jest.Mock).mockResolvedValue(mockProgress)

      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lessonId: TEST_LESSON_ID,
        answers: [0, 1], // both wrong
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.passed).toBe(false)
      expect(data.data.score).toBe(0)
      expect(data.data.percentage).toBe(0)
    })

    it('should create new course progress when none exists', async () => {
      const mockNewProgress = { id: 'progress-new', userId: TEST_USER_ID, courseId: TEST_COURSE_ID }
      const mockQuizScore = {
        id: 'qs-1',
        courseProgressId: 'progress-new',
        lessonId: TEST_LESSON_ID,
        score: 1,
        maxScore: 2,
        completedAt: new Date(),
      }

      ;(prisma.quizQuestion.findMany as jest.Mock).mockResolvedValue(mockQuizQuestions)
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(null) // no existing progress
      ;(prisma.courseProgress.create as jest.Mock).mockResolvedValue(mockNewProgress)
      ;(prisma.quizScore.create as jest.Mock).mockResolvedValue(mockQuizScore)
      ;(prisma.courseProgress.update as jest.Mock).mockResolvedValue(mockNewProgress)

      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lessonId: TEST_LESSON_ID,
        answers: [2, 1], // one correct, one wrong
      })
      const response = await submitQuiz(request)
      await response.json()

      expect(response.status).toBe(201)
      expect(prisma.courseProgress.create).toHaveBeenCalledTimes(1)
    })

    it('should return 404 when lesson has no quiz questions', async () => {
      ;(prisma.quizQuestion.findMany as jest.Mock).mockResolvedValue([])

      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lessonId: TEST_LESSON_ID,
        answers: [0],
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should return 400 when answer count does not match question count', async () => {
      ;(prisma.quizQuestion.findMany as jest.Mock).mockResolvedValue(mockQuizQuestions)

      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lessonId: TEST_LESSON_ID,
        answers: [0], // only 1 answer for 2 questions
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
    })

    it('should return 400 for missing required fields', async () => {
      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: TEST_USER_ID,
        // missing courseId, lessonId, answers
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 400 for invalid userId format', async () => {
      const request = new NextRequest('http://localhost:3000/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'not-a-uuid',
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
          answers: [0],
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'not-a-uuid',
        },
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 403 when userId in body does not match authenticated user', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: otherUserId,
        courseId: TEST_COURSE_ID,
        lessonId: TEST_LESSON_ID,
        answers: [0, 1],
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
          answers: [0],
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.quizQuestion.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest('http://localhost:3000/api/quiz/submit', {
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lessonId: TEST_LESSON_ID,
        answers: [0],
      })
      const response = await submitQuiz(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('GET /api/quiz/submit (quiz attempts history)', () => {
    it('should return empty attempts when no userId or lessonId provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/quiz/submit', {
        headers: {
          'x-user-id': TEST_USER_ID,
          'x-user-email': 'test@example.com',
        },
      })
      const response = await getQuizAttempts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.attempts).toHaveLength(0)
      expect(data.data.total).toBe(0)
    })

    it('should return quiz attempts for a user and lesson', async () => {
      const mockCourseProgress = {
        id: 'progress-1',
        userId: TEST_USER_ID,
        quizScores: [
          {
            id: 'qs-1',
            score: 2,
            maxScore: 2,
            completedAt: new Date(),
            lessonId: TEST_LESSON_ID,
          },
        ],
      }

      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(mockCourseProgress)

      const request = new NextRequest(
        `http://localhost:3000/api/quiz/submit?userId=${TEST_USER_ID}&lessonId=${TEST_LESSON_ID}`,
        {
          headers: {
            'x-user-id': TEST_USER_ID,
            'x-user-email': 'test@example.com',
          },
        }
      )
      const response = await getQuizAttempts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.attempts).toHaveLength(1)
      expect(data.data.attempts[0].score).toBe(2)
      expect(data.data.total).toBe(1)
      expect(data.data.bestScore).toBe(100)
    })

    it('should return empty attempts when no course progress found', async () => {
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/quiz/submit?userId=${TEST_USER_ID}&lessonId=${TEST_LESSON_ID}`,
        {
          headers: {
            'x-user-id': TEST_USER_ID,
            'x-user-email': 'test@example.com',
          },
        }
      )
      const response = await getQuizAttempts(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.attempts).toHaveLength(0)
    })

    it('should return 403 when accessing another users quiz attempts', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = new NextRequest(
        `http://localhost:3000/api/quiz/submit?userId=${otherUserId}&lessonId=${TEST_LESSON_ID}`,
        {
          headers: {
            'x-user-id': TEST_USER_ID,
            'x-user-email': 'test@example.com',
          },
        }
      )
      const response = await getQuizAttempts(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })
  })
})
