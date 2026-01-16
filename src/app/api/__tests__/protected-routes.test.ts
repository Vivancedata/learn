import { NextRequest } from 'next/server'
import { POST as postDiscussion } from '../discussions/route'
import { PATCH as patchDiscussion } from '../discussions/[id]/route'
import { POST as postSubmission } from '../submissions/route'
import { PATCH as patchUserSettings } from '../user/settings/route'
import prisma from '@/lib/db'

// Helper to create a proper NextRequest with body
function createRequest(url: string, options: { method: string; body: unknown }) {
  return new NextRequest(url, {
    method: options.method,
    body: JSON.stringify(options.body),
    headers: {
      'Content-Type': 'application/json',
    },
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

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  getUserId: jest.fn(),
  isClerkConfigured: false,
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(() => ({ success: true, limit: 30, remaining: 29, resetTime: Date.now() + 60000 })),
  getClientIdentifier: jest.fn(() => 'test-identifier'),
  RATE_LIMITS: { mutation: { limit: 30, windowSeconds: 60 } },
}))

import { requireAuth, getUserId } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

describe('Protected API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAuth as jest.Mock).mockResolvedValue('test-user-id')
    ;(getUserId as jest.Mock).mockResolvedValue('test-user-id')
  })

  describe('POST /api/discussions', () => {
    it('should require authentication', async () => {
      ;(requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { content: 'Test', courseId: 'course-1' },
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate required fields with Zod', async () => {
      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { content: '' }, // Empty content
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should validate courseId or lessonId is required', async () => {
      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { content: 'Valid content' }, // No courseId or lessonId
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('courseId or lessonId')
    })

    it('should create discussion with valid data', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: 'test-user-id',
        content: 'Test discussion',
        courseId: 'course-1',
        lessonId: null,
        likes: 0,
        createdAt: new Date(),
        user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
      }

      // @ts-expect-error - mock implementation
      prisma.discussion.create.mockResolvedValue(mockDiscussion)

      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { content: 'Test discussion', courseId: 'course-1' },
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.content).toBe('Test discussion')
      expect(data.username).toBe('Test User')
    })

    it('should enforce rate limiting', async () => {
      ;(checkRateLimit as jest.Mock).mockReturnValue({
        success: false,
        limit: 30,
        remaining: 0,
        resetTime: Date.now() + 60000,
      })

      const request = createRequest('http://localhost:3000/api/discussions', {
        method: 'POST',
        body: { content: 'Test', courseId: 'course-1' },
      })

      const response = await postDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many requests')
    })
  })

  describe('PATCH /api/discussions/[id]', () => {
    it('should track likes per user', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: 'other-user',
        likes: 5,
      }

      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)
      // @ts-expect-error - mock implementation
      prisma.discussionLike.findUnique.mockResolvedValue(null) // User hasn't liked yet
      // @ts-expect-error - mock implementation
      prisma.$transaction.mockResolvedValue([
        { id: 'like-1', userId: 'test-user-id', discussionId: 'disc-1' },
        { ...mockDiscussion, likes: 6 },
      ])

      const request = createRequest('http://localhost:3000/api/discussions/disc-1', {
        method: 'PATCH',
        body: { like: true },
      })

      const response = await patchDiscussion(request, { params: Promise.resolve({ id: 'disc-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.likes).toBe(6)
      expect(data.liked).toBe(true)
    })

    it('should prevent duplicate likes', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: 'other-user',
        likes: 5,
      }

      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)
      // @ts-expect-error - mock implementation
      prisma.discussionLike.findUnique.mockResolvedValue({ id: 'like-1' }) // User already liked

      const request = createRequest('http://localhost:3000/api/discussions/disc-1', {
        method: 'PATCH',
        body: { like: true },
      })

      const response = await patchDiscussion(request, { params: Promise.resolve({ id: 'disc-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.alreadyLiked).toBe(true)
      expect(data.likes).toBe(5) // Unchanged
    })

    it('should only allow owner to edit content', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: 'other-user', // Different from test-user-id
        likes: 5,
      }

      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)

      const request = createRequest('http://localhost:3000/api/discussions/disc-1', {
        method: 'PATCH',
        body: { content: 'Updated content' },
      })

      const response = await patchDiscussion(request, { params: Promise.resolve({ id: 'disc-1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('POST /api/submissions', () => {
    beforeEach(() => {
      // Reset rate limit mock for submissions tests
      ;(checkRateLimit as jest.Mock).mockReturnValue({
        success: true,
        limit: 30,
        remaining: 29,
        resetTime: Date.now() + 60000,
      })
    })

    it('should validate GitHub URL format', async () => {
      const request = createRequest('http://localhost:3000/api/submissions', {
        method: 'POST',
        body: {
          lessonId: 'lesson-1',
          githubUrl: 'https://evil.com/github.com/fake', // Invalid - not actual github.com
        },
      })

      const response = await postSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('GitHub URL')
    })

    it('should accept valid GitHub URLs', async () => {
      const mockLesson = { id: 'lesson-1', title: 'Test Lesson' }
      const mockSubmission = {
        id: 'sub-1',
        userId: 'test-user-id',
        lessonId: 'lesson-1',
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
          lessonId: 'lesson-1',
          githubUrl: 'https://github.com/user/repo',
        },
      })

      const response = await postSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.githubUrl).toBe('https://github.com/user/repo')
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
      expect(data.error).toContain('email')
    })

    it('should validate GitHub username format', async () => {
      const request = createRequest('http://localhost:3000/api/user/settings', {
        method: 'PATCH',
        body: { githubUsername: 'invalid username!' }, // Spaces and special chars
      })

      const response = await patchUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should update settings with valid data', async () => {
      const mockUser = {
        id: 'test-user-id',
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
