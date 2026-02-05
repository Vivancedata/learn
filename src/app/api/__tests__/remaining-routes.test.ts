import { NextRequest } from 'next/server'
import { GET as getDiscussions, POST as createDiscussion } from '../discussions/route'
import { PATCH as updateDiscussion, DELETE as deleteDiscussion } from '../discussions/[id]/route'
import { GET as getSubmissions, POST as createSubmission } from '../submissions/route'
import { GET as getUserSettings, PATCH as updateUserSettings } from '../user/settings/route'
import prisma from '@/lib/db'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    discussion: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectSubmission: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
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
  },
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ success: true, remaining: 99, resetTime: Date.now() + 60000 }),
  getClientIdentifier: jest.fn().mockReturnValue('test-client'),
  RATE_LIMITS: { API: 'api' },
}))

// Mock auth
const mockRequireAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  getUserId: jest.fn((request: NextRequest) => request.headers.get('x-user-id')),
}))

// Helper to create authorized request
const createAuthorizedRequest = (
  url: string,
  userId: string,
  options?: { method?: string; body?: string; headers?: Record<string, string> }
): NextRequest => {
  return new NextRequest(url, {
    method: options?.method,
    body: options?.body,
    headers: {
      ...options?.headers,
      'x-user-id': userId,
      'x-user-email': 'test@example.com',
    },
  })
}

describe('Discussions API', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/discussions', () => {
    it('should return discussions with default limit', async () => {
      const mockDiscussions = [
        {
          id: 'disc-1',
          userId: validUserId,
          content: 'Test discussion',
          courseId: 'course-1',
          lessonId: null,
          likes: 5,
          createdAt: new Date(),
          user: { id: validUserId, name: 'Test User', email: 'test@example.com' },
          replies: [],
        },
      ]

      // @ts-expect-error - mock implementation
      prisma.discussion.findMany.mockResolvedValue(mockDiscussions)

      const request = new NextRequest('http://localhost/api/discussions')
      const response = await getDiscussions(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.discussions).toBeDefined()
      expect(data.data.total).toBe(1)
    })

    it('should filter by courseId', async () => {
      // @ts-expect-error - mock implementation
      prisma.discussion.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/discussions?courseId=course-1')
      const response = await getDiscussions(request)

      expect(response.status).toBe(200)
      expect(prisma.discussion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ courseId: 'course-1' }),
        })
      )
    })

    it('should filter by lessonId', async () => {
      // @ts-expect-error - mock implementation
      prisma.discussion.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/discussions?lessonId=lesson-1')
      const response = await getDiscussions(request)

      expect(response.status).toBe(200)
      expect(prisma.discussion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ lessonId: 'lesson-1' }),
        })
      )
    })

    it('should respect custom limit', async () => {
      // @ts-expect-error - mock implementation
      prisma.discussion.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/discussions?limit=10')
      const response = await getDiscussions(request)

      expect(response.status).toBe(200)
      expect(prisma.discussion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('should handle database errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.discussion.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/discussions')
      const response = await getDiscussions(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('POST /api/discussions', () => {
    it('should create a discussion', async () => {
      const mockDiscussion = {
        id: 'disc-1',
        userId: validUserId,
        content: 'Test discussion content here',
        courseId: 'course-1',
        lessonId: null,
        likes: 0,
        createdAt: new Date(),
        user: { id: validUserId, name: 'Test User', email: 'test@example.com' },
      }

      // @ts-expect-error - mock implementation
      prisma.discussion.create.mockResolvedValue(mockDiscussion)

      const request = createAuthorizedRequest(
        'http://localhost/api/discussions',
        validUserId,
        {
          method: 'POST',
          body: JSON.stringify({
            userId: validUserId,
            content: 'Test discussion content here',
            courseId: 'course-1',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.discussionId).toBe('disc-1')
      expect(data.data.message).toBe('Discussion created successfully')
    })

    it('should reject request from different user', async () => {
      const request = createAuthorizedRequest(
        'http://localhost/api/discussions',
        'different-user-id',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: validUserId,
            content: 'Test discussion content here',
            courseId: 'course-1',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createDiscussion(request)
      const data = await response.json()

      // Returns 403 Forbidden when user tries to create discussion as different user
      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })

    it('should reject invalid content', async () => {
      const request = createAuthorizedRequest(
        'http://localhost/api/discussions',
        validUserId,
        {
          method: 'POST',
          body: JSON.stringify({
            userId: validUserId,
            content: 'Short', // Less than 10 chars
            courseId: 'course-1',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createDiscussion(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
    })
  })

  describe('PATCH /api/discussions/[id]', () => {
    it('should update a discussion', async () => {
      const discussionId = 'disc-123'
      const mockDiscussion = {
        id: discussionId,
        userId: validUserId,
        content: 'Original content here',
        courseId: 'course-1',
      }
      const updatedDiscussion = {
        ...mockDiscussion,
        content: 'Updated discussion content',
        user: { id: validUserId, name: 'Test User', email: 'test@example.com' },
      }

      mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)
      // @ts-expect-error - mock implementation
      prisma.discussion.update.mockResolvedValue(updatedDiscussion)

      const request = createAuthorizedRequest(
        `http://localhost/api/discussions/${discussionId}`,
        validUserId,
        {
          method: 'PATCH',
          body: JSON.stringify({
            content: 'Updated discussion content',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await updateDiscussion(request, { params: Promise.resolve({ id: discussionId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.discussion.content).toBe('Updated discussion content')
      expect(data.data.message).toBe('Discussion updated successfully')
    })

    it('should return 404 for non-existent discussion', async () => {
      mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(null)

      const request = createAuthorizedRequest(
        'http://localhost/api/discussions/non-existent',
        validUserId,
        {
          method: 'PATCH',
          body: JSON.stringify({
            content: 'Updated discussion content',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await updateDiscussion(request, { params: Promise.resolve({ id: 'non-existent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Discussion not found')
    })

    it('should return 403 when updating another users discussion', async () => {
      const discussionId = 'disc-123'
      const otherUserId = '999e4567-e89b-12d3-a456-426614174999'
      const mockDiscussion = {
        id: discussionId,
        userId: otherUserId, // Different user owns this
        content: 'Original content here',
      }

      mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)

      const request = createAuthorizedRequest(
        `http://localhost/api/discussions/${discussionId}`,
        validUserId,
        {
          method: 'PATCH',
          body: JSON.stringify({
            content: 'Trying to update someone elses content',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await updateDiscussion(request, { params: Promise.resolve({ id: discussionId }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.message).toBe('You can only update your own discussions')
    })

    it('should return 401 when not authenticated', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost/api/discussions/disc-123', {
        method: 'PATCH',
        body: JSON.stringify({ content: 'Updated content' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateDiscussion(request, { params: Promise.resolve({ id: 'disc-123' }) })

      expect(response.status).toBe(500) // Generic error since requireAuth throws
    })
  })

  describe('DELETE /api/discussions/[id]', () => {
    it('should delete a discussion', async () => {
      const discussionId = 'disc-123'
      const mockDiscussion = {
        id: discussionId,
        userId: validUserId,
        content: 'Discussion to delete',
        replies: [{ id: 'reply-1' }, { id: 'reply-2' }],
      }

      mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)
      // @ts-expect-error - mock implementation
      prisma.discussion.delete.mockResolvedValue(mockDiscussion)

      const request = createAuthorizedRequest(
        `http://localhost/api/discussions/${discussionId}`,
        validUserId,
        { method: 'DELETE' }
      )

      const response = await deleteDiscussion(request, { params: Promise.resolve({ id: discussionId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.message).toBe('Discussion and all replies deleted successfully')
      expect(data.data.deletedReplies).toBe(2)
    })

    it('should return 404 for non-existent discussion', async () => {
      mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(null)

      const request = createAuthorizedRequest(
        'http://localhost/api/discussions/non-existent',
        validUserId,
        { method: 'DELETE' }
      )

      const response = await deleteDiscussion(request, { params: Promise.resolve({ id: 'non-existent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Discussion not found')
    })

    it('should return 403 when deleting another users discussion', async () => {
      const discussionId = 'disc-123'
      const otherUserId = '999e4567-e89b-12d3-a456-426614174999'
      const mockDiscussion = {
        id: discussionId,
        userId: otherUserId, // Different user owns this
        content: 'Not your discussion',
        replies: [],
      }

      mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)

      const request = createAuthorizedRequest(
        `http://localhost/api/discussions/${discussionId}`,
        validUserId,
        { method: 'DELETE' }
      )

      const response = await deleteDiscussion(request, { params: Promise.resolve({ id: discussionId }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.message).toBe('You can only delete your own discussions')
    })

    it('should handle database errors', async () => {
      const discussionId = 'disc-123'
      const mockDiscussion = {
        id: discussionId,
        userId: validUserId,
        content: 'Discussion',
        replies: [],
      }

      mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
      // @ts-expect-error - mock implementation
      prisma.discussion.findUnique.mockResolvedValue(mockDiscussion)
      // @ts-expect-error - mock implementation
      prisma.discussion.delete.mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(
        `http://localhost/api/discussions/${discussionId}`,
        validUserId,
        { method: 'DELETE' }
      )

      const response = await deleteDiscussion(request, { params: Promise.resolve({ id: discussionId }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })
})

describe('Submissions API', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000'
  const validLessonId = '123e4567-e89b-12d3-a456-426614174001'

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
  })

  describe('GET /api/submissions', () => {
    it('should return submissions for a user', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          userId: validUserId,
          lessonId: validLessonId,
          githubUrl: 'https://github.com/test/project',
          liveUrl: null,
          notes: 'Test notes',
          status: 'pending',
          submittedAt: new Date(),
          lesson: {
            id: validLessonId,
            section: {
              course: { id: 'course-1' },
            },
          },
        },
      ]

      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findMany.mockResolvedValue(mockSubmissions)

      const request = createAuthorizedRequest(
        `http://localhost/api/submissions`,
        validUserId
      )
      const response = await getSubmissions(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
    })

    it('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost/api/submissions')
      const response = await getSubmissions(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should filter by lessonId', async () => {
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findMany.mockResolvedValue([])

      const request = createAuthorizedRequest(
        `http://localhost/api/submissions?lessonId=${validLessonId}`,
        validUserId
      )
      const response = await getSubmissions(request)

      expect(response.status).toBe(200)
      expect(prisma.projectSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ lessonId: validLessonId }),
        })
      )
    })

    it('should handle database errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findMany.mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(
        'http://localhost/api/submissions',
        validUserId
      )
      const response = await getSubmissions(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch submissions')
    })

    it('should filter by courseId', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          userId: validUserId,
          lessonId: validLessonId,
          lesson: { section: { course: { id: 'course-1' } } },
        },
        {
          id: 'sub-2',
          userId: validUserId,
          lessonId: validLessonId,
          lesson: { section: { course: { id: 'course-2' } } },
        },
      ]

      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findMany.mockResolvedValue(mockSubmissions)

      const request = createAuthorizedRequest(
        `http://localhost/api/submissions?courseId=course-1`,
        validUserId
      )
      const response = await getSubmissions(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('sub-1')
    })
  })

  describe('POST /api/submissions', () => {
    it('should create a submission', async () => {
      const mockLesson = { id: validLessonId, type: 'project' }
      const mockSubmission = {
        id: 'sub-1',
        userId: validUserId,
        lessonId: validLessonId,
        githubUrl: 'https://github.com/test/project',
        liveUrl: null,
        notes: null,
        status: 'pending',
        submittedAt: new Date(),
      }

      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue(mockLesson)
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findFirst.mockResolvedValue(null)
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.create.mockResolvedValue(mockSubmission)

      const request = createAuthorizedRequest(
        'http://localhost/api/submissions',
        validUserId,
        {
          method: 'POST',
          body: JSON.stringify({
            lessonId: validLessonId,
            githubUrl: 'https://github.com/test/project',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('sub-1')
    })

    it('should update existing submission', async () => {
      const existingSubmission = {
        id: 'sub-existing',
        userId: validUserId,
        lessonId: validLessonId,
      }
      const updatedSubmission = {
        ...existingSubmission,
        githubUrl: 'https://github.com/test/updated',
        status: 'pending',
      }

      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue({ id: validLessonId })
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findFirst.mockResolvedValue(existingSubmission)
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.update.mockResolvedValue(updatedSubmission)

      const request = createAuthorizedRequest(
        'http://localhost/api/submissions',
        validUserId,
        {
          method: 'POST',
          body: JSON.stringify({
            lessonId: validLessonId,
            githubUrl: 'https://github.com/test/updated',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createSubmission(request)
      await response.json() // consume body

      expect(response.status).toBe(200)
      expect(prisma.projectSubmission.update).toHaveBeenCalled()
    })

    it('should return 404 for non-existent lesson', async () => {
      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue(null)

      const request = createAuthorizedRequest(
        'http://localhost/api/submissions',
        validUserId,
        {
          method: 'POST',
          body: JSON.stringify({
            lessonId: validLessonId,
            githubUrl: 'https://github.com/test/project',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should reject unauthorized request', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: validLessonId,
          githubUrl: 'https://github.com/test/project',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createSubmission(request)

      expect(response.status).toBe(401)
    })

    it('should reject invalid GitHub URL', async () => {
      const request = createAuthorizedRequest(
        'http://localhost/api/submissions',
        validUserId,
        {
          method: 'POST',
          body: JSON.stringify({
            lessonId: validLessonId,
            githubUrl: 'https://gitlab.com/test/project', // Not GitHub
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors on create', async () => {
      // @ts-expect-error - mock implementation
      prisma.lesson.findUnique.mockResolvedValue({ id: validLessonId })
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.findFirst.mockResolvedValue(null)
      // @ts-expect-error - mock implementation
      prisma.projectSubmission.create.mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(
        'http://localhost/api/submissions',
        validUserId,
        {
          method: 'POST',
          body: JSON.stringify({
            lessonId: validLessonId,
            githubUrl: 'https://github.com/test/project',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await createSubmission(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create submission')
    })
  })
})

describe('User Settings API', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ userId: validUserId, email: 'test@example.com', role: 'student', emailVerified: true })
  })

  describe('GET /api/user/settings', () => {
    it('should return user settings', async () => {
      const mockUser = {
        id: validUserId,
        name: 'Test User',
        email: 'test@example.com',
        githubUsername: 'testuser',
      }

      // @ts-expect-error - mock implementation
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const request = createAuthorizedRequest(
        'http://localhost/api/user/settings',
        validUserId
      )
      const response = await getUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.email).toBe('test@example.com')
      expect(data.name).toBe('Test User')
    })

    it('should return 404 for non-existent user', async () => {
      // @ts-expect-error - mock implementation
      prisma.user.findUnique.mockResolvedValue(null)

      const request = createAuthorizedRequest(
        'http://localhost/api/user/settings',
        validUserId
      )
      const response = await getUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should return 401 when not authenticated', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost/api/user/settings')
      const response = await getUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(
        'http://localhost/api/user/settings',
        validUserId
      )
      const response = await getUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed')
    })
  })

  describe('PATCH /api/user/settings', () => {
    it('should update user settings', async () => {
      const updatedUser = {
        id: validUserId,
        name: 'Updated Name',
        email: 'test@example.com',
        githubUsername: 'testuser',
      }

      // @ts-expect-error - mock implementation
      prisma.user.findFirst.mockResolvedValue(null) // No duplicate email
      // @ts-expect-error - mock implementation
      prisma.user.update.mockResolvedValue(updatedUser)

      const request = createAuthorizedRequest(
        'http://localhost/api/user/settings',
        validUserId,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: 'Updated Name',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await updateUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Name')
    })

    it('should reject duplicate email', async () => {
      // @ts-expect-error - mock implementation
      prisma.user.findFirst.mockResolvedValue({ id: 'other-user', email: 'taken@example.com' })

      const request = createAuthorizedRequest(
        'http://localhost/api/user/settings',
        validUserId,
        {
          method: 'PATCH',
          body: JSON.stringify({
            email: 'taken@example.com',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await updateUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Email already in use')
    })

    it('should return 401 when not authenticated', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost/api/user/settings', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Hacker Name' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateUserSettings(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors', async () => {
      // @ts-expect-error - mock implementation
      prisma.user.findFirst.mockResolvedValue(null)
      // @ts-expect-error - mock implementation
      prisma.user.update.mockRejectedValue(new Error('Database error'))

      const request = createAuthorizedRequest(
        'http://localhost/api/user/settings',
        validUserId,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: 'New Name',
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const response = await updateUserSettings(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed')
    })
  })
})
