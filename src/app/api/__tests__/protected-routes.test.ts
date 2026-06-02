import { NextRequest } from 'next/server'
import { POST as postDiscussion } from '../discussions/route'
import { PATCH as patchDiscussion } from '../discussions/[id]/route'
import { PATCH as patchUserSettings } from '../user/settings/route'
import { GET as getPointsUser } from '../points/user/[userId]/route'
import { POST as awardXpRoute } from '../xp/award/route'
import prisma from '@/lib/db'

const prismaMock = prisma as unknown as {
  discussion: {
    findMany: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    count: jest.Mock
  }
  discussionLike: {
    findUnique: jest.Mock
    create: jest.Mock
    delete: jest.Mock
    deleteMany: jest.Mock
  }
  discussionReply: { deleteMany: jest.Mock }
  discussionReplyLike: { deleteMany: jest.Mock }
  projectSubmission: {
    findFirst: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
    delete: jest.Mock
  }
  lesson: { findUnique: jest.Mock }
  user: { findUnique: jest.Mock; findFirst: jest.Mock; update: jest.Mock }
  communityPoint: { findMany: jest.Mock; count: jest.Mock }
  xpTransaction: { create: jest.Mock; findFirst: jest.Mock }
  $transaction: jest.Mock
}

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

// Helper to create a proper NextRequest with body and auth headers
function createRequest(
  url: string,
  options: { method: string; body: unknown; userId?: string | null }
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add x-user-id header if userId provided (simulating middleware injection)
  if (options.userId !== null) {
    headers['x-user-id'] = options.userId || TEST_USER_ID
    headers['x-user-email'] = 'test@example.com'
    headers['x-user-name'] = 'Test User'
  }

  return new NextRequest(url, {
    method: options.method,
    body: JSON.stringify(options.body),
    headers,
  })
}

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    discussion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    discussionLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    discussionReply: {
      deleteMany: jest.fn(),
    },
    discussionReplyLike: {
      deleteMany: jest.fn(),
    },
    projectSubmission: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    communityPoint: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    xpTransaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock the auth module - requireAuth is async and returns AuthSession
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  getUserId: jest.fn(),
  getAuthUser: jest.fn(),
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  __esModule: true,
  default: {
    check: jest.fn(() => ({ success: true, remaining: 99, resetTime: Date.now() + 900000 })),
  },
  checkRateLimit: jest.fn(() => ({ success: true, remaining: 99, resetTime: Date.now() + 900000 })),
  getClientIdentifier: jest.fn(() => 'test-identifier'),
  RATE_LIMITS: {
    API: { limit: 100, windowMs: 900000 },
    AUTH: { limit: 5, windowMs: 900000 },
    GENERAL: { limit: 1000, windowMs: 900000 },
  },
}))

import { requireAuth, getAuthUser, getUserId } from '@/lib/auth'

describe('Protected API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock requireAuth to return a valid session
    ;(requireAuth as jest.Mock).mockResolvedValue({
      userId: TEST_USER_ID,
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
      emailVerified: true,
    })
    ;(getAuthUser as jest.Mock).mockResolvedValue({
      userId: TEST_USER_ID,
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
      emailVerified: true,
    })
    ;(getUserId as jest.Mock).mockReturnValue(TEST_USER_ID)
  })

  describe('POST /api/discussions', () => {
    it('should require userId in body', async () => {
      // Request without userId in body should fail validation
      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { content: 'Test content here', courseId: 'course-1' },
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should validate required fields with Zod', async () => {
      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { userId: TEST_USER_ID, content: '' }, // Empty content
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should validate courseId or lessonId is required', async () => {
      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { userId: TEST_USER_ID, content: 'Valid content here for testing' }, // No courseId or lessonId
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      // The validation error message is returned in the details or as a generic Bad Request
      expect(data.error).toBeDefined()
    })

    it('should create discussion with valid data', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: TEST_USER_ID,
        content: 'Test discussion content',
        courseId: 'course-1',
        lessonId: null,
        likes: 0,
        createdAt: new Date(),
        user: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com' },
      }

      prismaMock.discussion.create.mockResolvedValue(mockDiscussion)

      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { userId: TEST_USER_ID, content: 'Test discussion content', courseId: 'course-1' },
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.content).toBe('Test discussion content')
    })

    it('should reject when userId in body does not match authenticated user', async () => {
      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: {
          userId: '550e8400-e29b-41d4-a716-446655440099', // Different from header
          content: 'Test discussion content',
          courseId: 'course-1'
        },
        userId: TEST_USER_ID, // Header value
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      // requireOwnership throws 403 Forbidden when authenticated user doesn't own the resource
      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })
  })

  describe('PATCH /api/discussions/[id]', () => {
    it('should only allow owner to edit content', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: 'other-user', // Different from TEST_USER_ID
        content: 'Original content',
        likes: 5,
      }

      prismaMock.discussion.findUnique.mockResolvedValue(mockDiscussion)

      const request = createRequest('http://localhost:3000/api/discussions/disc-1', {
        method: 'PATCH',
        body: { content: 'Updated content here for testing' },
      })

      const response = await patchDiscussion(request, { params: Promise.resolve({ id: 'disc-1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })

    it('should update content when user is owner', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: TEST_USER_ID, // Same as authenticated user
        content: 'Original content',
        likes: 5,
      }

      const updatedDiscussion = {
        ...mockDiscussion,
        content: 'Updated content here for testing',
        user: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com' },
      }

      prismaMock.discussion.findUnique.mockResolvedValue(mockDiscussion)
      prismaMock.discussion.update.mockResolvedValue(updatedDiscussion)

      const request = createRequest('http://localhost:3000/api/discussions/disc-1', {
        method: 'PATCH',
        body: { content: 'Updated content here for testing' },
      })

      const response = await patchDiscussion(request, { params: Promise.resolve({ id: 'disc-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.discussion.content).toBe('Updated content here for testing')
    })

    it('should return 404 for non-existent discussion', async () => {
      prismaMock.discussion.findUnique.mockResolvedValue(null)

      const request = createRequest('http://localhost:3000/api/discussions/non-existent', {
        method: 'PATCH',
        body: { content: 'Updated content here for testing' },
      })

      const response = await patchDiscussion(request, { params: Promise.resolve({ id: 'non-existent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Not Found')
    })
  })

  describe('PATCH /api/user/settings', () => {
    it('should validate email format', async () => {
      const request = createRequest('http://localhost:3000/api/user/settings', {
        method: 'PATCH',
        body: { email: 'invalid-email' },
      })

      const response = await patchUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should update settings with valid data', async () => {
      const mockUser = {
        id: TEST_USER_ID,
        name: 'Updated Name',
        email: 'test@example.com',
        githubUsername: 'validuser',
      }

      prismaMock.user.findFirst.mockResolvedValue(null) // No duplicate email
      prismaMock.user.update.mockResolvedValue(mockUser)

      const request = createRequest('http://localhost:3000/api/user/settings', {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      })

      const response = await patchUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('Updated Name')
    })
  })

  describe('GET /api/points/user/[userId]', () => {
    const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440099'

    it('should forbid reading another user point history', async () => {
      const request = createRequest(
        `http://localhost:3000/api/points/user/${OTHER_USER_ID}`,
        { method: 'GET', body: undefined, userId: TEST_USER_ID }
      )

      const response = await getPointsUser(request, {
        params: Promise.resolve({ userId: OTHER_USER_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
      // Must short-circuit before touching point data
      expect(prismaMock.communityPoint.findMany).not.toHaveBeenCalled()
    })

    it('should allow a user to read their own point history', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_USER_ID,
        name: 'Test User',
        email: 'test@example.com',
        points: 12,
        showOnLeaderboard: true,
      })
      prismaMock.communityPoint.findMany.mockResolvedValue([])
      prismaMock.communityPoint.count.mockResolvedValue(0)

      const request = createRequest(
        `http://localhost:3000/api/points/user/${TEST_USER_ID}`,
        { method: 'GET', body: undefined, userId: TEST_USER_ID }
      )

      const response = await getPointsUser(request, {
        params: Promise.resolve({ userId: TEST_USER_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.user.totalPoints).toBe(12)
      expect(data.data.user.badge.level).toBe('helper')
    })

    it('should return 404 when the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const request = createRequest(
        `http://localhost:3000/api/points/user/${TEST_USER_ID}`,
        { method: 'GET', body: undefined, userId: TEST_USER_ID }
      )
      const response = await getPointsUser(request, {
        params: Promise.resolve({ userId: TEST_USER_ID }),
      })
      expect(response.status).toBe(404)
    })

    it('should award the super-helper badge and map discussion/reply context', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_USER_ID,
        name: null, // exercises the email-prefix fallback for giver name
        email: 'owner@example.com',
        points: 50,
        showOnLeaderboard: true,
      })
      prismaMock.communityPoint.findMany.mockResolvedValue([
        {
          id: 'cp-1',
          reason: 'great answer',
          createdAt: new Date(),
          giver: { id: 'g1', name: null, email: 'helper@example.com' },
          discussion: { id: 'd1', content: 'x'.repeat(200), courseId: 'c1', lessonId: null },
          reply: null,
        },
        {
          id: 'cp-2',
          reason: null,
          createdAt: new Date(),
          giver: { id: 'g2', name: 'Giver Two', email: 'g2@example.com' },
          discussion: null,
          reply: { id: 'r1', content: 'short reply', discussionId: 'd2' },
        },
        {
          id: 'cp-3',
          reason: null,
          createdAt: new Date(),
          giver: { id: 'g3', name: 'Giver Three', email: 'g3@example.com' },
          discussion: null,
          reply: null,
        },
      ])
      prismaMock.communityPoint.count.mockResolvedValue(3)

      const request = createRequest(
        `http://localhost:3000/api/points/user/${TEST_USER_ID}`,
        { method: 'GET', body: undefined, userId: TEST_USER_ID }
      )
      const response = await getPointsUser(request, {
        params: Promise.resolve({ userId: TEST_USER_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.user.badge.level).toBe('super')
      const contexts = data.data.recentPointsReceived.map(
        (p: { context: { type: string } | null }) => p.context?.type ?? null
      )
      expect(contexts).toEqual(['discussion', 'reply', null])
      // Long discussion content is truncated with an ellipsis
      expect(data.data.recentPointsReceived[0].context.preview.endsWith('...')).toBe(true)
      // Giver with no name falls back to the email prefix
      expect(data.data.recentPointsReceived[0].giver.name).toBe('helper')
    })

    it('should return no badge for a user below the helper threshold', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_USER_ID,
        name: 'Low Points',
        email: 'low@example.com',
        points: 3,
        showOnLeaderboard: true,
      })
      prismaMock.communityPoint.findMany.mockResolvedValue([])
      prismaMock.communityPoint.count.mockResolvedValue(0)

      const request = createRequest(
        `http://localhost:3000/api/points/user/${TEST_USER_ID}`,
        { method: 'GET', body: undefined, userId: TEST_USER_ID }
      )
      const response = await getPointsUser(request, {
        params: Promise.resolve({ userId: TEST_USER_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.user.badge).toBeNull()
    })
  })

  describe('POST /api/xp/award', () => {
    it('should derive XP amount server-side and ignore a client-supplied amount', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ totalXp: 0, level: 1 })
      prismaMock.$transaction.mockResolvedValue([])

      const request = createRequest('http://localhost:3000/api/xp/award', {
        method: 'POST',
        body: {
          userId: TEST_USER_ID,
          amount: 9999, // attempted self-cheat — must be ignored
          source: 'LESSON_COMPLETE',
        },
      })

      const response = await awardXpRoute(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      // Canonical XP_VALUES.LESSON_COMPLETE is 50, not the client's 9999
      expect(data.data.xpAwarded).toBe(50)
      expect(data.data.totalXp).toBe(50)
    })
  })
})
