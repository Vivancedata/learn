import { NextRequest } from 'next/server'
import { POST as toggleDiscussionLike } from '../discussions/[id]/like/route'
import { POST as toggleReplyLike } from '../discussions/replies/[replyId]/like/route'
import prisma from '@/lib/db'

const prismaMock = prisma as unknown as {
  discussion: { findUnique: jest.Mock; update: jest.Mock }
  discussionLike: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock }
  discussionReply: { findUnique: jest.Mock; update: jest.Mock }
  discussionReplyLike: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock }
  $transaction: jest.Mock
}

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    discussion: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    discussionLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    discussionReply: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    discussionReplyLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    userId: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'student',
    emailVerified: true,
  }),
}))

describe('Discussion likes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('toggles like on discussion', async () => {
    prismaMock.discussion.findUnique.mockResolvedValue({ id: 'disc-1', likes: 1 })
    prismaMock.discussionLike.findUnique.mockResolvedValue(null)
    prismaMock.$transaction.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/discussions/disc-1/like', { method: 'POST' })
    const res = await toggleDiscussionLike(req, { params: Promise.resolve({ id: 'disc-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.liked).toBe(true)
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })

  it('toggles unlike on discussion', async () => {
    prismaMock.discussion.findUnique.mockResolvedValue({ id: 'disc-1', likes: 2 })
    prismaMock.discussionLike.findUnique.mockResolvedValue({ id: 'like-1' })
    prismaMock.$transaction.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/discussions/disc-1/like', { method: 'POST' })
    const res = await toggleDiscussionLike(req, { params: Promise.resolve({ id: 'disc-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.liked).toBe(false)
  })

  it('returns 404 when discussion is not found', async () => {
    prismaMock.discussion.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/discussions/missing/like', { method: 'POST' })
    const res = await toggleDiscussionLike(req, { params: Promise.resolve({ id: 'missing' }) })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.message).toContain('Discussion')
  })

  it('toggles like on reply', async () => {
    prismaMock.discussionReply.findUnique.mockResolvedValue({ id: 'reply-1', likes: 0 })
    prismaMock.discussionReplyLike.findUnique.mockResolvedValue(null)
    prismaMock.$transaction.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/discussions/replies/reply-1/like', { method: 'POST' })
    const res = await toggleReplyLike(req, { params: Promise.resolve({ replyId: 'reply-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.liked).toBe(true)
  })

  it('toggles unlike on reply', async () => {
    prismaMock.discussionReply.findUnique.mockResolvedValue({ id: 'reply-1', likes: 3 })
    prismaMock.discussionReplyLike.findUnique.mockResolvedValue({ id: 'reply-like-1' })
    prismaMock.$transaction.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/discussions/replies/reply-1/like', { method: 'POST' })
    const res = await toggleReplyLike(req, { params: Promise.resolve({ replyId: 'reply-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.liked).toBe(false)
  })

  it('returns 404 when reply is not found', async () => {
    prismaMock.discussionReply.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/discussions/replies/missing/like', { method: 'POST' })
    const res = await toggleReplyLike(req, { params: Promise.resolve({ replyId: 'missing' }) })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.message).toContain('Discussion reply')
  })
})
