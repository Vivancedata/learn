import { NextRequest } from 'next/server'
import { GET as getLeaderboards } from '../leaderboards/route'
import { GET as getUserLeaderboards } from '../leaderboards/user/[userId]/route'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    leaderboardCache: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    certificate: {
      groupBy: jest.fn(),
    },
    dailyActivity: {
      groupBy: jest.fn(),
    },
    courseProgress: {
      findMany: jest.fn(),
    },
    communityPoint: {
      groupBy: jest.fn(),
    },
  },
}))

// Helper to create params promise
function createParams<T>(params: T): { params: Promise<T> } {
  return { params: Promise.resolve(params) }
}

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

describe('Leaderboards API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/leaderboards', () => {
    it('should return leaderboard data from cache', async () => {
      const mockCacheEntries = [
        {
          id: 'cache-1',
          rank: 1,
          previousRank: 2,
          userId: TEST_USER_ID,
          score: 1500,
          calculatedAt: new Date(),
          metadata: null,
          type: 'XP',
          period: 'ALL_TIME',
          user: {
            id: TEST_USER_ID,
            name: 'Test User',
            email: 'test@example.com',
            showOnLeaderboard: true,
          },
        },
      ]

      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue(mockCacheEntries)
      ;(prisma.leaderboardCache.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=xp&period=all_time')
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.entries).toHaveLength(1)
      expect(data.data.entries[0].rank).toBe(1)
      expect(data.data.type).toBe('xp')
      expect(data.data.period).toBe('all_time')
    })

    it('should use default type=xp and period=all_time when not specified', async () => {
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue([])
      // For the fallback calculateLeaderboard path (xp, all_time)
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/leaderboards')
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.type).toBe('xp')
      expect(data.data.period).toBe('all_time')
    })

    it('should filter out users who have showOnLeaderboard=false from cache', async () => {
      const mockCacheEntries = [
        {
          id: 'cache-1',
          rank: 1,
          previousRank: null,
          userId: TEST_USER_ID,
          score: 1500,
          calculatedAt: new Date(),
          metadata: null,
          type: 'XP',
          period: 'ALL_TIME',
          user: {
            id: TEST_USER_ID,
            name: 'Private User',
            email: 'private@example.com',
            showOnLeaderboard: false,
          },
        },
      ]

      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue(mockCacheEntries)
      ;(prisma.leaderboardCache.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=xp&period=all_time')
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // User with showOnLeaderboard=false should be filtered out
      expect(data.data.entries).toHaveLength(0)
    })

    it('should return 400 for invalid query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=invalid_type&period=all_time')
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should calculate leaderboard on the fly when cache is empty (xp type)', async () => {
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: TEST_USER_ID,
          name: 'Test User',
          email: 'test@example.com',
          points: 500,
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=xp&period=all_time')
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.entries).toHaveLength(1)
      expect(data.data.entries[0].score).toBe(500)
    })

    it('should calculate streaks leaderboard when cache is empty', async () => {
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: TEST_USER_ID,
          name: 'Streak User',
          email: 'streak@example.com',
          currentStreak: 15,
          longestStreak: 30,
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=streaks&period=all_time')
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.entries[0].score).toBe(15)
    })

    it('should include current user rank when authenticated user is not in top list', async () => {
      const currentUserId = '660e8400-e29b-41d4-a716-446655440001'
      const mockCacheEntry = {
        id: 'cache-1',
        rank: 1,
        previousRank: null,
        userId: TEST_USER_ID,
        score: 1500,
        calculatedAt: new Date(),
        metadata: null,
        type: 'XP',
        period: 'ALL_TIME',
        user: {
          id: TEST_USER_ID,
          name: 'Top User',
          email: 'top@example.com',
          showOnLeaderboard: true,
        },
      }
      const mockCurrentUserEntry = {
        id: 'cache-current',
        rank: 50,
        previousRank: 55,
        userId: currentUserId,
        score: 100,
        calculatedAt: new Date(),
        metadata: null,
        type: 'XP',
        period: 'ALL_TIME',
        user: {
          id: currentUserId,
          name: 'Current User',
          email: 'current@example.com',
          showOnLeaderboard: true,
        },
      }

      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue([mockCacheEntry])
      ;(prisma.leaderboardCache.findUnique as jest.Mock).mockResolvedValue(mockCurrentUserEntry)

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=xp&period=all_time', {
        headers: {
          'x-user-id': currentUserId,
          'x-user-email': 'current@example.com',
        },
      })
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.currentUserRank).toBeDefined()
      expect(data.data.currentUserRank.rank).toBe(50)
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/leaderboards?type=xp&period=all_time')
      const response = await getLeaderboards(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('GET /api/leaderboards/user/[userId]', () => {
    it('should return user rankings across all leaderboard types', async () => {
      const mockUser = {
        id: TEST_USER_ID,
        name: 'Test User',
        email: 'test@example.com',
        showOnLeaderboard: true,
      }
      const mockCachedRankings = [
        { type: 'XP', period: 'ALL_TIME', rank: 5, previousRank: 7, score: 1200 },
        { type: 'STREAKS', period: 'WEEKLY', rank: 3, previousRank: 4, score: 10 },
      ]

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue(mockCachedRankings)
      ;(prisma.leaderboardCache.count as jest.Mock).mockResolvedValue(100)

      const request = new NextRequest(`http://localhost:3000/api/leaderboards/user/${TEST_USER_ID}`)
      const response = await getUserLeaderboards(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.userId).toBe(TEST_USER_ID)
      expect(data.data.userName).toBe('Test User')
      expect(data.data.showOnLeaderboard).toBe(true)
      expect(data.data.rankings).toHaveLength(2)
      expect(data.data.typeLabels).toBeDefined()
      expect(data.data.periodLabels).toBeDefined()
    })

    it('should return 404 when user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/leaderboards/user/${TEST_USER_ID}`)
      const response = await getUserLeaderboards(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should return empty rankings when user has no cached entries', async () => {
      const mockUser = {
        id: TEST_USER_ID,
        name: 'New User',
        email: 'new@example.com',
        showOnLeaderboard: true,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.leaderboardCache.count as jest.Mock).mockResolvedValue(0)

      const request = new NextRequest(`http://localhost:3000/api/leaderboards/user/${TEST_USER_ID}`)
      const response = await getUserLeaderboards(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.rankings).toHaveLength(0)
    })

    it('should use email prefix as name when user has no name', async () => {
      const mockUser = {
        id: TEST_USER_ID,
        name: null,
        email: 'testuser@example.com',
        showOnLeaderboard: true,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.leaderboardCache.count as jest.Mock).mockResolvedValue(0)

      const request = new NextRequest(`http://localhost:3000/api/leaderboards/user/${TEST_USER_ID}`)
      const response = await getUserLeaderboards(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.userName).toBe('testuser')
    })

    it('should sort rankings by rank ascending', async () => {
      const mockUser = {
        id: TEST_USER_ID,
        name: 'Test User',
        email: 'test@example.com',
        showOnLeaderboard: true,
      }
      const mockCachedRankings = [
        { type: 'XP', period: 'ALL_TIME', rank: 10, previousRank: null, score: 500 },
        { type: 'STREAKS', period: 'ALL_TIME', rank: 2, previousRank: null, score: 20 },
        { type: 'COURSES_COMPLETED', period: 'ALL_TIME', rank: 5, previousRank: null, score: 3 },
      ]

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.leaderboardCache.findMany as jest.Mock).mockResolvedValue(mockCachedRankings)
      ;(prisma.leaderboardCache.count as jest.Mock).mockResolvedValue(50)

      const request = new NextRequest(`http://localhost:3000/api/leaderboards/user/${TEST_USER_ID}`)
      const response = await getUserLeaderboards(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(200)
      // Rankings sorted by rank ascending: 2, 5, 10
      expect(data.data.rankings[0].rank).toBe(2)
      expect(data.data.rankings[1].rank).toBe(5)
      expect(data.data.rankings[2].rank).toBe(10)
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/leaderboards/user/${TEST_USER_ID}`)
      const response = await getUserLeaderboards(request, createParams({ userId: TEST_USER_ID }))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })
})
