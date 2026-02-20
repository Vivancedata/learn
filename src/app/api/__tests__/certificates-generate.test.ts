import { NextRequest } from 'next/server'
import { POST as generateCertificate } from '../certificates/generate/route'
import prisma from '@/lib/db'

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_COURSE_ID = 'course-1'

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    subscription: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    certificate: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    courseProgress: {
      findFirst: jest.fn(),
    },
  },
}))

function createRequest(overrides: Partial<{ userId: string; courseId: string }> = {}) {
  const userId = overrides.userId ?? TEST_USER_ID
  const courseId = overrides.courseId ?? TEST_COURSE_ID

  return new NextRequest('http://localhost:3000/api/certificates/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-email': 'user@example.com',
      'x-user-name': 'Test User',
    },
    body: JSON.stringify({ userId, courseId }),
  })
}

function createCourse(overrides: Partial<{
  learningOutcomes: string | null
  sections: Array<{
    id: string
    lessons: Array<{ id: string; quizQuestions: unknown[] }>
  }>
}> = {}) {
  return {
    id: TEST_COURSE_ID,
    title: 'Python Fundamentals',
    learningOutcomes: '["Python", "Problem Solving"]',
    sections: [
      {
        id: 'section-1',
        lessons: [
          { id: 'lesson-1', quizQuestions: [{}] },
          { id: 'lesson-2', quizQuestions: [] },
        ],
      },
    ],
    ...overrides,
  }
}

function createProgress(overrides: Partial<{
  completedLessons: Array<{ id: string }>
  quizScores: Array<{ lessonId: string }>
}> = {}) {
  return {
    id: 'progress-1',
    completedLessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
    quizScores: [{ lessonId: 'lesson-1' }],
    ...overrides,
  }
}

describe('POST /api/certificates/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue({ status: 'active' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: TEST_USER_ID,
      name: 'Test User',
      email: 'user@example.com',
    })
    ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(createCourse())
    ;(prisma.certificate.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(createProgress())
    ;(prisma.certificate.create as jest.Mock).mockResolvedValue({
      id: 'cert-1',
      userId: TEST_USER_ID,
      courseId: TEST_COURSE_ID,
      verificationCode: 'ABC123',
      skills: JSON.stringify(['Python', 'Problem Solving']),
      issueDate: new Date().toISOString(),
      expiryDate: null,
      user: {
        id: TEST_USER_ID,
        name: 'Test User',
        email: 'user@example.com',
      },
      course: {
        id: TEST_COURSE_ID,
        title: 'Python Fundamentals',
        difficulty: 'Beginner',
        durationHours: 10,
      },
    })
  })

  it('requires a Pro subscription', async () => {
    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.message).toContain('Pro subscription')
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('continues with normal validation flow for Pro users', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.message).toContain('User not found')
  })

  it('returns 404 when course does not exist', async () => {
    ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(null)

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.message).toContain('Course not found')
  })

  it('returns existing certificate when one already exists', async () => {
    ;(prisma.certificate.findFirst as jest.Mock).mockResolvedValue({
      id: 'cert-existing',
      userId: TEST_USER_ID,
      courseId: TEST_COURSE_ID,
    })

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.message).toContain('already exists')
    expect(prisma.certificate.create).not.toHaveBeenCalled()
  })

  it('returns validation error when course has not been started', async () => {
    ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(null)

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.message).toContain('course not started')
  })

  it('returns validation error when not all lessons are complete', async () => {
    ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(
      createProgress({
        completedLessons: [{ id: 'lesson-1' }],
      })
    )

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.message).toContain('course not completed')
  })

  it('returns validation error when quiz requirements are not met', async () => {
    ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(
      createProgress({
        quizScores: [],
      })
    )

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.message).toContain('all quizzes must be completed')
  })

  it('creates a certificate and falls back to course title when outcomes are invalid JSON', async () => {
    ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(
      createCourse({ learningOutcomes: '{not-json' })
    )
    ;(prisma.certificate.create as jest.Mock).mockResolvedValue({
      id: 'cert-new',
      userId: TEST_USER_ID,
      courseId: TEST_COURSE_ID,
      verificationCode: 'DEF456',
      skills: JSON.stringify(['Python Fundamentals']),
      issueDate: new Date().toISOString(),
      expiryDate: null,
      user: {
        id: TEST_USER_ID,
        name: 'Test User',
        email: 'user@example.com',
      },
      course: {
        id: TEST_COURSE_ID,
        title: 'Python Fundamentals',
        difficulty: 'Beginner',
        durationHours: 10,
      },
    })

    const response = await generateCertificate(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data.message).toContain('generated successfully')
    expect(payload.data.certificate.skills).toEqual(['Python Fundamentals'])
    expect(prisma.certificate.create).toHaveBeenCalled()
  })
})
