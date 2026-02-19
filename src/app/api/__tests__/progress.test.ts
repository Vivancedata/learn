import { NextRequest } from 'next/server'
import { POST as markLessonComplete, GET as getLessonProgress } from '../progress/lessons/route'
import { GET as getUserProgress } from '../progress/user/[userId]/route'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    lesson: {
      findUnique: jest.fn(),
    },
    courseProgress: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dailyActivity: {
      upsert: jest.fn(),
    },
    xpTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    course: {
      count: jest.fn(),
    },
  },
}))

// Mock analytics to avoid side effects in tests
jest.mock('@/lib/analytics-server', () => ({
  serverAnalytics: {
    trackLessonCompleted: jest.fn(),
    trackStreakUpdate: jest.fn(),
    track: jest.fn(),
  },
}))

// Mock xp-service so we don't need the full Prisma chain
jest.mock('@/lib/xp-service', () => ({
  awardLessonCompleteXp: jest.fn().mockResolvedValue({ xpAwarded: 50, leveledUp: false }),
  hasReceivedXpFor: jest.fn().mockResolvedValue(false),
  awardStreakBonusXp: jest.fn().mockResolvedValue(null),
}))

// Helper to create params promise
function createParams<T>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) }
}

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_COURSE_ID = 'python-basics'
const TEST_LESSON_ID = '550e8400-e29b-41d4-a716-446655440001'

// Helper to create an authorized request with body
function createAuthorizedRequest(url: string, options?: { method?: string; body?: string }): NextRequest {
  return new NextRequest(url, {
    method: options?.method,
    body: options?.body,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': TEST_USER_ID,
      'x-user-email': 'test@example.com',
    },
  })
}

describe('Progress API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/progress/lessons', () => {
    const mockLesson = { id: TEST_LESSON_ID, title: 'Introduction to Python' }
    const mockCourseProgress = {
      id: 'progress-1',
      userId: TEST_USER_ID,
      courseId: TEST_COURSE_ID,
      lastAccessed: new Date(),
      completedLessons: [{ id: TEST_LESSON_ID, title: 'Introduction to Python' }],
    }

    it('should mark a lesson as complete and create new progress', async () => {
      ;(prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson)
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(null) // no existing progress
      ;(prisma.courseProgress.create as jest.Mock).mockResolvedValue(mockCourseProgress)

      // Mock the streak-related DB calls inside recordActivityAndUpdateStreak
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: TEST_USER_ID,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakFreezes: 0,
      })
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue({ id: 'act-1' })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: TEST_USER_ID, currentStreak: 1, longestStreak: 1 })

      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
        }),
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.progressId).toBe('progress-1')
      expect(data.data.completedLessonsCount).toBe(1)
      expect(prisma.courseProgress.create).toHaveBeenCalledTimes(1)
    })

    it('should mark a lesson complete on existing progress', async () => {
      const existingProgress = {
        id: 'progress-1',
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lastAccessed: new Date(),
        completedLessons: [], // lesson not yet completed
      }
      const updatedProgress = {
        ...existingProgress,
        completedLessons: [{ id: TEST_LESSON_ID, title: 'Introduction to Python' }],
      }

      ;(prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson)
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(existingProgress)
      ;(prisma.courseProgress.update as jest.Mock).mockResolvedValue(updatedProgress)

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: TEST_USER_ID,
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: null,
        streakFreezes: 0,
      })
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue({ id: 'act-1' })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: TEST_USER_ID, currentStreak: 4, longestStreak: 5 })

      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
        }),
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.completedLessonsCount).toBe(1)
    })

    it('should not award XP for already-completed lesson (idempotent)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { hasReceivedXpFor } = require('@/lib/xp-service')
      ;(hasReceivedXpFor as jest.Mock).mockResolvedValue(true) // XP already awarded

      const progressWithLesson = {
        id: 'progress-1',
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lastAccessed: new Date(),
        completedLessons: [{ id: TEST_LESSON_ID, title: 'Introduction to Python' }],
      }

      ;(prisma.lesson.findUnique as jest.Mock).mockResolvedValue(mockLesson)
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(progressWithLesson)
      // Lesson already completed → update lastAccessed only
      ;(prisma.courseProgress.update as jest.Mock).mockResolvedValue(progressWithLesson)

      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
        }),
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      // xpAwarded = 0 since XP was already given
      expect(data.data.xpAwarded).toBe(0)
    })

    it('should return 400 for missing required fields', async () => {
      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }), // missing courseId and lessonId
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 400 for invalid lessonId UUID', async () => {
      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          lessonId: 'invalid-uuid',
        }),
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 403 when userId in body does not match authenticated user', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({
          userId: otherUserId,
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
        }),
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.lesson.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
          lessonId: TEST_LESSON_ID,
        }),
      })
      const response = await markLessonComplete(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('GET /api/progress/lessons (query params)', () => {
    it('should return empty progress when userId or courseId is missing', async () => {
      const request = createAuthorizedRequest('http://localhost:3000/api/progress/lessons')
      const response = await getLessonProgress(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.completedLessons).toHaveLength(0)
      expect(data.data.totalCompleted).toBe(0)
    })

    it('should return lesson progress for a user and course', async () => {
      const mockProgress = {
        id: 'progress-1',
        userId: TEST_USER_ID,
        courseId: TEST_COURSE_ID,
        lastAccessed: new Date(),
        completedLessons: [
          { id: TEST_LESSON_ID, title: 'Introduction to Python' },
        ],
        quizScores: [
          { id: 'qs-1', score: 8, maxScore: 10, completedAt: new Date() },
        ],
      }

      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(mockProgress)

      const request = createAuthorizedRequest(
        `http://localhost:3000/api/progress/lessons?userId=${TEST_USER_ID}&courseId=${TEST_COURSE_ID}`
      )
      const response = await getLessonProgress(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.completedLessons).toHaveLength(1)
      expect(data.data.totalCompleted).toBe(1)
      expect(data.data.quizScores).toHaveLength(1)
    })

    it('should return empty progress when no progress found for user/course combo', async () => {
      ;(prisma.courseProgress.findFirst as jest.Mock).mockResolvedValue(null)

      const request = createAuthorizedRequest(
        `http://localhost:3000/api/progress/lessons?userId=${TEST_USER_ID}&courseId=${TEST_COURSE_ID}`
      )
      const response = await getLessonProgress(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.completedLessons).toHaveLength(0)
      expect(data.data.totalCompleted).toBe(0)
    })

    it('should return 403 when accessing another users progress', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest(
        `http://localhost:3000/api/progress/lessons?userId=${otherUserId}&courseId=${TEST_COURSE_ID}`
      )
      const response = await getLessonProgress(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })
  })

  describe('GET /api/progress/user/[userId]', () => {
    const mockCourseProgressRecords = [
      {
        courseId: TEST_COURSE_ID,
        lastAccessed: new Date(),
        course: {
          id: TEST_COURSE_ID,
          title: 'Python Basics',
          sections: [
            {
              id: 'section-1',
              lessons: [
                { id: TEST_LESSON_ID },
                { id: '550e8400-e29b-41d4-a716-446655440002' },
              ],
            },
          ],
        },
        completedLessons: [{ id: TEST_LESSON_ID }],
      },
    ]

    it('should return user progress across all enrolled courses', async () => {
      ;(prisma.courseProgress.findMany as jest.Mock).mockResolvedValue(mockCourseProgressRecords)
      ;(prisma.course.count as jest.Mock).mockResolvedValue(10)

      const request = createAuthorizedRequest(`http://localhost:3000/api/progress/user/${TEST_USER_ID}`)
      const response = await getUserProgress(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.userId).toBe(TEST_USER_ID)
      expect(data.courses).toHaveLength(1)
      expect(data.courses[0].courseId).toBe(TEST_COURSE_ID)
      expect(data.courses[0].totalLessons).toBe(2)
      expect(data.courses[0].completedLessons).toBe(1)
      expect(data.courses[0].progress).toBe(50)
      expect(data.overallStats).toBeDefined()
      expect(data.overallStats.totalCourses).toBe(10)
      expect(data.overallStats.coursesStarted).toBe(1)
    })

    it('should correctly identify completed courses (100% progress)', async () => {
      const completedCourseProgress = [
        {
          courseId: TEST_COURSE_ID,
          lastAccessed: new Date(),
          course: {
            id: TEST_COURSE_ID,
            title: 'Python Basics',
            sections: [
              {
                id: 'section-1',
                lessons: [{ id: TEST_LESSON_ID }],
              },
            ],
          },
          completedLessons: [{ id: TEST_LESSON_ID }], // all lessons completed
        },
      ]

      ;(prisma.courseProgress.findMany as jest.Mock).mockResolvedValue(completedCourseProgress)
      ;(prisma.course.count as jest.Mock).mockResolvedValue(5)

      const request = createAuthorizedRequest(`http://localhost:3000/api/progress/user/${TEST_USER_ID}`)
      const response = await getUserProgress(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.courses[0].progress).toBe(100)
      expect(data.overallStats.coursesCompleted).toBe(1)
    })

    it('should return empty progress for user with no enrolled courses', async () => {
      ;(prisma.courseProgress.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.course.count as jest.Mock).mockResolvedValue(8)

      const request = createAuthorizedRequest(`http://localhost:3000/api/progress/user/${TEST_USER_ID}`)
      const response = await getUserProgress(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.courses).toHaveLength(0)
      expect(data.overallStats.coursesStarted).toBe(0)
      expect(data.overallStats.coursesCompleted).toBe(0)
      expect(data.overallStats.totalCourses).toBe(8)
      expect(data.overallStats.overallProgress).toBe(0)
    })

    it('should return 403 when user tries to access another users overall progress', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest(`http://localhost:3000/api/progress/user/${otherUserId}`)
      const response = await getUserProgress(request, createParams({ userId: otherUserId }))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest(`http://localhost:3000/api/progress/user/${TEST_USER_ID}`)
      const response = await getUserProgress(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.courseProgress.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(`http://localhost:3000/api/progress/user/${TEST_USER_ID}`)
      const response = await getUserProgress(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    it('should correctly calculate overall progress across multiple courses', async () => {
      const multiCourseProgress = [
        {
          courseId: 'course-1',
          lastAccessed: new Date(),
          course: {
            id: 'course-1',
            title: 'Python Basics',
            sections: [
              { id: 'sec-1', lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }] },
            ],
          },
          completedLessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }], // 100%
        },
        {
          courseId: 'course-2',
          lastAccessed: new Date(),
          course: {
            id: 'course-2',
            title: 'Advanced Python',
            sections: [
              { id: 'sec-2', lessons: [{ id: 'lesson-3' }, { id: 'lesson-4' }] },
            ],
          },
          completedLessons: [], // 0%
        },
      ]

      ;(prisma.courseProgress.findMany as jest.Mock).mockResolvedValue(multiCourseProgress)
      ;(prisma.course.count as jest.Mock).mockResolvedValue(5)

      const request = createAuthorizedRequest(`http://localhost:3000/api/progress/user/${TEST_USER_ID}`)
      const response = await getUserProgress(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.courses).toHaveLength(2)
      // 2 total lessons completed out of 4 total = 50%
      expect(data.overallStats.completedLessons).toBe(2)
      expect(data.overallStats.totalLessons).toBe(4)
      expect(data.overallStats.overallProgress).toBe(50)
      expect(data.overallStats.coursesCompleted).toBe(1)
    })
  })
})
