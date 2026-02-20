import { NextRequest } from 'next/server'
import { GET as getAllAchievements } from '../achievements/all/route'
import { GET as getUserAchievements } from '../achievements/user/[userId]/route'
import { POST as checkAchievements } from '../achievements/check/route'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    userAchievement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    achievement: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    path: {
      findMany: jest.fn(),
    },
  },
}))

// Helper to create params promise
function createParams<T>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) }
}

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

// Helper to create an authorized request
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

describe('Achievements API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure no bleed from previous test implementations
    ;(prisma.user.findUnique as jest.Mock).mockImplementation(() => Promise.resolve(undefined))
    ;(prisma.userAchievement.findMany as jest.Mock).mockImplementation(() => Promise.resolve([]))
    ;(prisma.userAchievement.create as jest.Mock).mockImplementation(() => Promise.resolve({}))
    ;(prisma.achievement.findUnique as jest.Mock).mockImplementation(() => Promise.resolve(null))
    ;(prisma.achievement.create as jest.Mock).mockImplementation(() => Promise.resolve({}))
    ;(prisma.path.findMany as jest.Mock).mockImplementation(() => Promise.resolve([]))
  })

  describe('GET /api/achievements/all', () => {
    it('should return all achievements', async () => {
      const request = new NextRequest('http://localhost:3000/api/achievements/all')
      const response = await getAllAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.data.all).toBeDefined()
      expect(data.data.byCategory).toBeDefined()
      // The real ACHIEVEMENTS array has many achievements - just verify it's a positive number
      expect(data.data.total).toBeGreaterThan(0)
    })

    it('should return achievements grouped by category', async () => {
      const request = new NextRequest('http://localhost:3000/api/achievements/all')
      const response = await getAllAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.byCategory).toBeDefined()
      expect(data.data.byCategory.lessons).toBeDefined()
    })

    it('should include total count matching all array length', async () => {
      const request = new NextRequest('http://localhost:3000/api/achievements/all')
      const response = await getAllAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.total).toBe(data.data.all.length)
    })
  })

  describe('GET /api/achievements/user/[userId]', () => {
    it('should return user achievements when authorized', async () => {
      const mockUser = { id: TEST_USER_ID, name: 'Test User' }
      const mockAchievements = [
        {
          id: 'ua-1',
          userId: TEST_USER_ID,
          achievementId: 'first-lesson',
          earnedAt: new Date(),
          achievement: { id: 'first-lesson', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯' },
        },
      ]

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.userAchievement.findMany as jest.Mock).mockResolvedValue(mockAchievements)

      const request = createAuthorizedRequest(`http://localhost:3000/api/achievements/user/${TEST_USER_ID}`)
      const response = await getUserAchievements(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.achievements).toHaveLength(1)
      expect(data.data.count).toBe(1)
    })

    it('should return 404 when user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createAuthorizedRequest(`http://localhost:3000/api/achievements/user/${TEST_USER_ID}`)
      const response = await getUserAchievements(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should return 403 when user tries to access another user achievements', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest(`http://localhost:3000/api/achievements/user/${otherUserId}`)
      const response = await getUserAchievements(request, createParams({ userId: otherUserId }))
      const data = await response.json()

      // requireOwnership compares x-user-id header (TEST_USER_ID) with otherUserId → 403
      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest(`http://localhost:3000/api/achievements/user/${TEST_USER_ID}`)
      const response = await getUserAchievements(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should return empty achievements list when user has none', async () => {
      const mockUser = { id: TEST_USER_ID, name: 'Test User' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([])

      const request = createAuthorizedRequest(`http://localhost:3000/api/achievements/user/${TEST_USER_ID}`)
      const response = await getUserAchievements(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.achievements).toHaveLength(0)
      expect(data.data.count).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(`http://localhost:3000/api/achievements/user/${TEST_USER_ID}`)
      const response = await getUserAchievements(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('POST /api/achievements/check', () => {
    // User with 0 lessons completed but already has early-adopter achievement
    // (early-adopter has checkCondition: () => true, so it's always earned)
    const mockUserNoProgress = {
      id: TEST_USER_ID,
      name: 'Test User',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      achievements: [
        // User already has early-adopter (the always-earned achievement)
        {
          id: 'ua-early',
          achievementId: 'early-adopter',
          earnedAt: new Date(),
          achievement: { id: 'early-adopter', name: 'Early Adopter' },
        },
      ],
      courses: [], // no courses started
      projectSubmissions: [],
      certificates: [],
      discussions: [],
      discussionReplies: [],
    }

    // User with 1 lesson completed — should earn 'first-lesson' achievement
    const mockUserWithOneLesson = {
      id: TEST_USER_ID,
      name: 'Test User',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      achievements: [], // has no achievements yet
      courses: [
        {
          completedLessons: [{ id: 'lesson-1' }],
          quizScores: [],
          course: {
            durationHours: 5,
            sections: [
              {
                lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
              },
            ],
          },
        },
      ],
      projectSubmissions: [],
      certificates: [],
      discussions: [],
      discussionReplies: [],
    }

    it('should return 200 and no new achievements when user has no progress', async () => {
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUserNoProgress) // initial lookup
        .mockResolvedValueOnce({ id: TEST_USER_ID, achievements: [] }) // updated user

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.newAchievements).toHaveLength(0)
      expect(data.data.stats).toBeDefined()
      expect(data.data.stats.completedLessons).toBe(0)
    })

    it('should award first-lesson achievement and return 201 when user completes first lesson', async () => {
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUserWithOneLesson)
        .mockResolvedValueOnce({
          id: TEST_USER_ID,
          achievements: [
            {
              id: 'ua-new',
              achievementId: 'first-lesson',
              earnedAt: new Date(),
              achievement: { id: 'first-lesson', name: 'First Steps' },
            },
          ],
        })
      // achievement.findUnique returns existing achievement (no need to create)
      ;(prisma.achievement.findUnique as jest.Mock).mockResolvedValue({
        id: 'first-lesson',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
      })
      ;(prisma.userAchievement.create as jest.Mock).mockResolvedValue({
        userId: TEST_USER_ID,
        achievementId: 'first-lesson',
        earnedAt: new Date(),
      })

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.newAchievements).toContain('first-lesson')
      expect(data.data.stats.completedLessons).toBe(1)
    })

    it('should compute completedPaths based on started paths only', async () => {
      const mockUserWithPaths = {
        id: TEST_USER_ID,
        name: 'Path Learner',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        achievements: [
          {
            id: 'ua-early',
            achievementId: 'early-adopter',
            earnedAt: new Date(),
            achievement: { id: 'early-adopter', name: 'Early Adopter' },
          },
        ],
        courses: [
          {
            courseId: 'course-1',
            completedLessons: [{ id: 'l1' }, { id: 'l2' }],
            quizScores: [],
            course: {
              pathId: 'path-1',
              durationHours: 6,
              sections: [{ lessons: [{ id: 'l1' }, { id: 'l2' }] }],
            },
          },
          {
            courseId: 'course-2',
            completedLessons: [],
            quizScores: [],
            course: {
              pathId: 'path-2',
              durationHours: 2,
              sections: [{ lessons: [{ id: 'x1' }] }],
            },
          },
        ],
        projectSubmissions: [],
        certificates: [],
        discussions: [],
        discussionReplies: [],
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUserWithPaths)
        .mockResolvedValueOnce({ id: TEST_USER_ID, achievements: [] })
      ;(prisma.path.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'path-1',
          courses: [
            {
              id: 'course-1',
              sections: [{ lessons: [{ id: 'l1' }, { id: 'l2' }] }],
            },
          ],
        },
        {
          id: 'path-2',
          courses: [
            {
              id: 'course-2',
              sections: [{ lessons: [] }],
            },
          ],
        },
      ])

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect([200, 201]).toContain(response.status)
      expect(data.data.stats.completedPaths).toBe(1)
      expect(prisma.path.findMany).toHaveBeenCalled()
    })

    it('should create missing achievement definition and ignore duplicate award insert', async () => {
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUserWithOneLesson)
        .mockResolvedValueOnce({ id: TEST_USER_ID, achievements: [] })
      ;(prisma.achievement.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.achievement.create as jest.Mock).mockResolvedValue({
        id: 'first-lesson',
        name: 'First Steps',
      })
      ;(prisma.userAchievement.create as jest.Mock).mockRejectedValue(new Error('Unique constraint failed'))

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.newAchievements).toContain('first-lesson')
      expect(prisma.achievement.create).toHaveBeenCalled()
    })

    it('should handle candidate paths with empty courses or missing user progress', async () => {
      const mockUserWithStartedPaths = {
        id: TEST_USER_ID,
        name: 'Path Learner',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        achievements: [],
        courses: [
          {
            courseId: 'course-1',
            completedLessons: [{ id: 'l1' }],
            quizScores: [],
            course: {
              pathId: 'path-empty',
              durationHours: null,
              sections: [{ lessons: [{ id: 'l1' }] }],
            },
          },
          {
            courseId: 'course-2',
            completedLessons: [{ id: 'l2' }],
            quizScores: [],
            course: {
              pathId: 'path-missing-progress',
              durationHours: null,
              sections: [{ lessons: [{ id: 'l2' }] }],
            },
          },
        ],
        projectSubmissions: [],
        certificates: [],
        discussions: [],
        discussionReplies: [],
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUserWithStartedPaths)
        .mockResolvedValueOnce({ id: TEST_USER_ID, achievements: [] })
      ;(prisma.path.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'path-empty',
          courses: [],
        },
        {
          id: 'path-missing-progress',
          courses: [
            {
              id: 'course-3',
              sections: [{ lessons: [{ id: 'x1' }] }],
            },
          ],
        },
      ])

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect([200, 201]).toContain(response.status)
      expect(data.data.stats.completedPaths).toBe(0)
    })

    it('should return empty achievements array when updated user lookup returns null', async () => {
      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUserNoProgress)
        .mockResolvedValueOnce(null)

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.achievements).toEqual([])
    })

    it('should return 400 for invalid userId format', async () => {
      const request = new NextRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: 'not-a-uuid' }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'not-a-uuid',
          'x-user-email': 'test@example.com',
        },
      })

      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 404 when user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should return 403 when user tries to check achievements for another user', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: otherUserId }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
        headers: { 'Content-Type': 'application/json' },
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest('http://localhost:3000/api/achievements/check', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await checkAchievements(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })
})
