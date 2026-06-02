import { NextRequest } from 'next/server'
import { POST as submitProject, GET as getProjects } from '../projects/route'
import prisma from '@/lib/db'

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    lesson: { findUnique: jest.fn() },
    projectSubmission: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getUserId: jest.fn((request: NextRequest) => request.headers.get('x-user-id')),
}))

jest.mock('@/lib/analytics-server', () => ({
  serverAnalytics: { trackProjectSubmitted: jest.fn() },
}))

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_LESSON_ID = '550e8400-e29b-41d4-a716-446655440001'
const VALID_GITHUB = 'https://github.com/user/repo'

function authedRequest(
  url: string,
  options?: { method?: string; body?: unknown; userId?: string | null }
): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options?.userId !== null) {
    headers['x-user-id'] = options?.userId || TEST_USER_ID
    headers['x-user-email'] = 'test@example.com'
  }
  return new NextRequest(url, {
    method: options?.method,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers,
  })
}

describe('Projects API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/projects', () => {
    it('creates a new submission for a project lesson', async () => {
      ;(prisma.lesson.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: TEST_LESSON_ID, hasProject: true })
        .mockResolvedValueOnce({ id: TEST_LESSON_ID, section: { courseId: 'course-1' } })
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectSubmission.create as jest.Mock).mockResolvedValue({
        id: 'sub-1',
        status: 'pending',
        submittedAt: new Date(),
      })

      const request = authedRequest('http://localhost/api/projects', {
        method: 'POST',
        body: { userId: TEST_USER_ID, lessonId: TEST_LESSON_ID, githubUrl: VALID_GITHUB },
      })
      const response = await submitProject(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.submissionId).toBe('sub-1')
      expect(data.data.message).toBe('Project submitted successfully')
    })

    it('creates a submission with a live URL and notes', async () => {
      ;(prisma.lesson.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: TEST_LESSON_ID, hasProject: true })
        .mockResolvedValueOnce({ id: TEST_LESSON_ID, section: { courseId: 'course-1' } })
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectSubmission.create as jest.Mock).mockResolvedValue({
        id: 'sub-2',
        status: 'pending',
        submittedAt: new Date(),
      })

      const request = authedRequest('http://localhost/api/projects', {
        method: 'POST',
        body: {
          userId: TEST_USER_ID,
          lessonId: TEST_LESSON_ID,
          githubUrl: VALID_GITHUB,
          liveUrl: 'https://example.com',
          notes: 'My submission notes',
        },
      })
      const response = await submitProject(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.submissionId).toBe('sub-2')
      expect(prisma.projectSubmission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            liveUrl: 'https://example.com',
            notes: 'My submission notes',
          }),
        })
      )
    })

    it('updates (resubmits) an existing submission', async () => {
      ;(prisma.lesson.findUnique as jest.Mock).mockResolvedValue({
        id: TEST_LESSON_ID,
        hasProject: true,
      })
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue({ id: 'sub-existing' })
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        id: 'sub-existing',
        status: 'pending',
        submittedAt: new Date(),
      })

      const request = authedRequest('http://localhost/api/projects', {
        method: 'POST',
        body: { userId: TEST_USER_ID, lessonId: TEST_LESSON_ID, githubUrl: VALID_GITHUB },
      })
      const response = await submitProject(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.message).toBe('Project resubmitted successfully')
      expect(prisma.projectSubmission.create).not.toHaveBeenCalled()
    })

    it('returns 404 when the lesson does not exist', async () => {
      ;(prisma.lesson.findUnique as jest.Mock).mockResolvedValue(null)
      const request = authedRequest('http://localhost/api/projects', {
        method: 'POST',
        body: { userId: TEST_USER_ID, lessonId: TEST_LESSON_ID, githubUrl: VALID_GITHUB },
      })
      const response = await submitProject(request)
      expect(response.status).toBe(404)
    })

    it('returns 400 when the lesson has no project', async () => {
      ;(prisma.lesson.findUnique as jest.Mock).mockResolvedValue({
        id: TEST_LESSON_ID,
        hasProject: false,
      })
      const request = authedRequest('http://localhost/api/projects', {
        method: 'POST',
        body: { userId: TEST_USER_ID, lessonId: TEST_LESSON_ID, githubUrl: VALID_GITHUB },
      })
      const response = await submitProject(request)
      expect(response.status).toBe(400)
    })

    it('forbids submitting on behalf of another user', async () => {
      const request = authedRequest('http://localhost/api/projects', {
        method: 'POST',
        body: {
          userId: '550e8400-e29b-41d4-a716-4466554400ff', // not the header user
          lessonId: TEST_LESSON_ID,
          githubUrl: VALID_GITHUB,
        },
        userId: TEST_USER_ID,
      })
      const response = await submitProject(request)
      expect(response.status).toBe(403)
    })

    it('rejects a non-GitHub URL', async () => {
      const request = authedRequest('http://localhost/api/projects', {
        method: 'POST',
        body: { userId: TEST_USER_ID, lessonId: TEST_LESSON_ID, githubUrl: 'https://evil.com/x' },
      })
      const response = await submitProject(request)
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.error).toBe('Bad Request')
    })
  })

  describe('GET /api/projects', () => {
    it('returns the authenticated user submissions', async () => {
      ;(prisma.projectSubmission.findMany as jest.Mock).mockResolvedValue([
        { id: 'sub-1', userId: TEST_USER_ID },
      ])
      const request = authedRequest(
        `http://localhost/api/projects?userId=${TEST_USER_ID}&lessonId=${TEST_LESSON_ID}&status=pending`
      )
      const response = await getProjects(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(prisma.projectSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            lessonId: TEST_LESSON_ID,
            status: 'pending',
          }),
        })
      )
    })

    it('defaults to the authenticated user when no userId query is given', async () => {
      ;(prisma.projectSubmission.findMany as jest.Mock).mockResolvedValue([])
      const request = authedRequest('http://localhost/api/projects')
      const response = await getProjects(request)
      expect(response.status).toBe(200)
    })

    it('forbids fetching another user submissions', async () => {
      const request = authedRequest(
        'http://localhost/api/projects?userId=550e8400-e29b-41d4-a716-4466554400ff'
      )
      const response = await getProjects(request)
      expect(response.status).toBe(403)
    })
  })
})
