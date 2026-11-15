/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'
import rateLimiter from '@/lib/rate-limit'

jest.unmock('next/server')

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/lib/rate-limit', () => ({
  __esModule: true,
  default: {
    check: jest.fn().mockResolvedValue({
      success: true,
      remaining: 1,
      resetTime: Date.now() + 60_000,
      limit: 5,
    }),
  },
  RATE_LIMITS: {
    AUTH: { limit: 5, windowMs: 60_000 },
    API: { limit: 100, windowMs: 60_000 },
  },
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
}))

const mockCheck = rateLimiter.check as jest.Mock

describe('proxy rate-limit bucket for auth routes', () => {
  beforeEach(() => jest.clearAllMocks())

  it('counts the session check against the API budget, not sign-in attempts', async () => {
    await proxy(new NextRequest('http://localhost/api/auth/me'))

    expect(mockCheck).toHaveBeenCalledTimes(1)
    expect(mockCheck.mock.calls[0][0]).toMatch(/^api:/)
    expect(mockCheck.mock.calls[0][1]).toBe(100)
  })

  it('keeps sign-in on the strict auth budget', async () => {
    await proxy(new NextRequest('http://localhost/api/auth/signin', { method: 'POST' }))

    expect(mockCheck).toHaveBeenCalledTimes(1)
    expect(mockCheck.mock.calls[0][0]).toMatch(/^auth:/)
    expect(mockCheck.mock.calls[0][1]).toBe(5)
  })
})
