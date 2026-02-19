import { NextRequest } from 'next/server'
import { GET as getUserStreak } from '../streaks/user/[userId]/route'
import { POST as recordActivity } from '../streaks/record/route'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dailyActivity: {
      findMany: jest.fn(),
      upsert: jest.fn(),
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

describe('Streaks API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/streaks/user/[userId]', () => {
    const mockUser = {
      id: TEST_USER_ID,
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      streakFreezes: 2,
    }

    it('should return streak information for the authenticated user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.dailyActivity.findMany as jest.Mock).mockResolvedValue([])

      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.userId).toBe(TEST_USER_ID)
      expect(data.data.currentStreak).toBe(5)
      expect(data.data.longestStreak).toBe(10)
      expect(data.data.streakFreezes).toBe(2)
      expect(data.data.streakStatus).toBeDefined()
    })

    it('should return at_risk status when last activity was yesterday', async () => {
      const userWithYesterdayActivity = {
        ...mockUser,
        lastActivityDate: (() => {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          yesterday.setHours(0, 0, 0, 0)
          return yesterday
        })(),
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithYesterdayActivity)
      ;(prisma.dailyActivity.findMany as jest.Mock).mockResolvedValue([])

      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.streakStatus).toBe('at_risk')
    })

    it('should return broken status when last activity was more than 1 day ago', async () => {
      const userWithOldActivity = {
        ...mockUser,
        lastActivityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithOldActivity)
      ;(prisma.dailyActivity.findMany as jest.Mock).mockResolvedValue([])

      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.streakStatus).toBe('broken')
    })

    it('should include today stats when user was active today', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayActivity = {
        id: 'activity-today',
        date: today,
        xpEarned: 50,
        lessonsCompleted: 2,
        quizzesTaken: 1,
        timeSpentMinutes: 30,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, lastActivityDate: today })
      ;(prisma.dailyActivity.findMany as jest.Mock).mockResolvedValue([todayActivity])

      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.todayActive).toBe(true)
      expect(data.data.todayStats).toBeDefined()
      expect(data.data.todayStats.xpEarned).toBe(50)
    })

    it('should return recentActivity from last 7 days', async () => {
      const recentActivities = [
        {
          id: 'act-1',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          xpEarned: 20,
          lessonsCompleted: 1,
          quizzesTaken: 0,
          timeSpentMinutes: 15,
        },
        {
          id: 'act-2',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          xpEarned: 30,
          lessonsCompleted: 2,
          quizzesTaken: 1,
          timeSpentMinutes: 25,
        },
      ]

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.dailyActivity.findMany as jest.Mock).mockResolvedValue(recentActivities)

      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.recentActivity).toHaveLength(2)
    })

    it('should return 404 when user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should return 403 when accessing another users streak', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${otherUserId}`)
      const response = await getUserStreak(request, createParams({ userId: otherUserId }))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(`http://localhost:3000/api/streaks/user/${TEST_USER_ID}`)
      const response = await getUserStreak(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('POST /api/streaks/record', () => {
    const mockUser = {
      id: TEST_USER_ID,
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: null,
      streakFreezes: 2,
    }

    const mockDailyActivity = {
      id: 'activity-1',
      userId: TEST_USER_ID,
      date: new Date(),
      xpEarned: 30,
      lessonsCompleted: 1,
      quizzesTaken: 0,
      timeSpentMinutes: 20,
    }

    const mockUpdatedUser = {
      id: TEST_USER_ID,
      currentStreak: 1,
      longestStreak: 10,
      lastActivityDate: new Date(),
      streakFreezes: 2,
    }

    it('should record activity and start streak for first-time user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue(mockDailyActivity)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser)

      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          xpEarned: 30,
          lessonsCompleted: 1,
        }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.userId).toBe(TEST_USER_ID)
      expect(data.data.streakAction).toBe('started')
      expect(data.data.todayActivity).toBeDefined()
    })

    it('should extend streak when user was active yesterday', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      const userWithYesterdayActivity = {
        ...mockUser,
        currentStreak: 5,
        lastActivityDate: yesterday,
      }
      const updatedUser = {
        ...mockUpdatedUser,
        currentStreak: 6,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithYesterdayActivity)
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue(mockDailyActivity)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          xpEarned: 10,
        }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.currentStreak).toBe(6)
      expect(data.data.streakAction).toBe('extended')
    })

    it('should maintain streak when user is already active today', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const userActiveToday = {
        ...mockUser,
        currentStreak: 5,
        lastActivityDate: today,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userActiveToday)
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue(mockDailyActivity)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUpdatedUser, currentStreak: 5 })

      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          lessonsCompleted: 1,
        }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.streakAction).toBe('maintained')
    })

    it('should restart streak when more than 1 day missed without freeze', async () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      threeDaysAgo.setHours(0, 0, 0, 0)

      const userWithBrokenStreak = {
        ...mockUser,
        currentStreak: 10,
        lastActivityDate: threeDaysAgo,
        streakFreezes: 0, // no freezes
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithBrokenStreak)
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue(mockDailyActivity)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUpdatedUser, currentStreak: 1 })

      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          lessonsCompleted: 1,
        }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.streakAction).toBe('started')
    })

    it('should use streak freeze when exactly 1 day was missed', async () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      twoDaysAgo.setHours(0, 0, 0, 0)

      const userWithMissedDay = {
        ...mockUser,
        currentStreak: 7,
        lastActivityDate: twoDaysAgo,
        streakFreezes: 1,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithMissedDay)
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue(mockDailyActivity)
      ;(prisma.user.update as jest.Mock)
        .mockResolvedValueOnce({ id: TEST_USER_ID, streakFreezes: 0 }) // freeze decrement
        .mockResolvedValueOnce({ ...mockUpdatedUser, currentStreak: 8 }) // streak update

      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({
          userId: TEST_USER_ID,
          lessonsCompleted: 1,
        }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.streakAction).toBe('continued')
    })

    it('should return 400 for missing userId', async () => {
      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({ xpEarned: 10 }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 400 for invalid userId format', async () => {
      const request = new NextRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({ userId: 'not-a-uuid' }),
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'not-a-uuid',
        },
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 403 when userId in body does not match authenticated user', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001'
      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({ userId: otherUserId, lessonsCompleted: 1 }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID, lessonsCompleted: 1 }),
        headers: { 'Content-Type': 'application/json' },
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should return 404 when user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID, lessonsCompleted: 1 }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID, lessonsCompleted: 1 }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })

    it('should accept optional fields and use defaults', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.dailyActivity.upsert as jest.Mock).mockResolvedValue({
        ...mockDailyActivity,
        xpEarned: 0,
        lessonsCompleted: 0,
        quizzesTaken: 0,
        timeSpentMinutes: 0,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser)

      // Only userId is required, all other fields are optional
      const request = createAuthorizedRequest('http://localhost:3000/api/streaks/record', {
        method: 'POST',
        body: JSON.stringify({ userId: TEST_USER_ID }),
      })
      const response = await recordActivity(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.todayActivity).toBeDefined()
    })
  })
})
