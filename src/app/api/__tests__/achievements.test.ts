import { NextRequest } from 'next/server'
import { GET as getAllAchievements } from '../achievements/all/route'
import { GET as getUserAchievements } from '../achievements/user/[userId]/route'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
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
    course: {
      count: jest.fn(),
    },
    xpTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
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
    ;(prisma.course.count as jest.Mock).mockImplementation(() => Promise.resolve(0))
    // Default: achievement XP already granted, so the bonus-XP path is skipped
    // and award tests keep their exact user.findUnique call sequence.
    ;(prisma.xpTransaction.findFirst as jest.Mock).mockImplementation(() =>
      Promise.resolve({ id: 'existing-xp' })
    )
    ;(prisma.$transaction as jest.Mock).mockImplementation(() => Promise.resolve([]))
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

})
