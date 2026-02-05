import { NextRequest } from 'next/server'
import { POST as postDiscussion } from '../discussions/route'
import { PATCH as patchDiscussion } from '../discussions/[id]/route'
import { POST as postSubmission } from '../submissions/route'
import { PATCH as patchUserSettings } from '../user/settings/route'
import prisma from '@/lib/db'

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
      create: jest.fn(),
      update: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
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

import { requireAuth, getAuthUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

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

      // @ts-expect-error - mock implementation
      prisma.discussion.create.mockResolvedValue(mockDiscussion)

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

      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)

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

      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)
      // @ts-expect-error - mock implementation
      prisma.discussion.update.mockResolvedValue(updatedDiscussion)

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
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(null)

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

  describe('POST /api/submissions', () => {
    const TEST_LESSON_ID = '550e8400-e29b-41d4-a716-446655440001'

    beforeEach(() => {
      // Reset rate limit mock for submissions tests
      ;(checkRateLimit as jest.Mock).mockReturnValue({
        success: true,
        remaining: 99,
        resetTime: Date.now() + 900000,
      })
    })

    it('should validate GitHub URL format', async () => {
      const request = createRequest('http://localhost:3000/api/submissions', {
        method: 'POST',
        body: {
          lessonId: TEST_LESSON_ID,
          githubUrl: 'https://evil.com/github.com/fake', // Invalid - not actual github.com
        },
      })

      const response = await postSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('GitHub')
    })

    it('should accept valid GitHub URLs', async () => {
      const mockLesson = { id: TEST_LESSON_ID, title: 'Test Lesson' }
      const mockSubmission = {
        id: 'sub-1',
        userId: TEST_USER_ID,
        lessonId: TEST_LESSON_ID,
        githubUrl: 'https://github.com/user/repo',
        status: 'pending',
      }

      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue(mockLesson)
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findFirst.mockResolvedValue(null)
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.create.mockResolvedValue(mockSubmission)

      const request = createRequest('http://localhost:3000/api/submissions', {
        method: 'POST',
        body: {
          lessonId: TEST_LESSON_ID,
          githubUrl: 'https://github.com/user/repo',
        },
      })

      const response = await postSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.githubUrl).toBe('https://github.com/user/repo')
    })

    it('should enforce rate limiting', async () => {
      ;(checkRateLimit as jest.Mock).mockReturnValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
      })

      const request = createRequest('http://localhost:3000/api/submissions', {
        method: 'POST',
        body: {
          lessonId: TEST_LESSON_ID,
          githubUrl: 'https://github.com/user/repo',
        },
      })

      const response = await postSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many requests')
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

      // @ts-expect-error - mock implementation
      prisma.user.findFirst.mockResolvedValue(null) // No duplicate email
      // @ts-expect-error - mock implementation
      prisma.user.update.mockResolvedValue(mockUser)

      const request = createRequest('http://localhost:3000/api/user/settings', {
        method: 'PATCH',
        body: { name: 'Updated Name' },
      })

      const response = await patchUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Name')
    })
  })
})
