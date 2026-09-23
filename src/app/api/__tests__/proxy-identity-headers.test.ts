/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'
import { getAuthenticatedUserId } from '@/lib/authorization'

// jest.setup.js mocks next/server with a NextResponse.next() that drops the
// forwarded request headers. Use the real one: those headers are what we test.
jest.unmock('next/server')

// jose ships ESM only; stand in for signature verification with a token table.
// Everything above jwtVerify (getAuthUser, verifyToken, the proxy) runs for real.
const mockVerifiedTokens: Record<string, Record<string, unknown>> = {}

jest.mock('jose', () => ({
  jwtVerify: jest.fn(async (token: string) => {
    const payload = mockVerifiedTokens[token]
    if (!payload) {
      throw new Error('signature verification failed')
    }
    return { payload }
  }),
}))

// No auth cookie: identity can only come from a Bearer token
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    get: jest.fn().mockReturnValue(undefined),
  })),
}))

jest.mock('@/lib/rate-limit', () => ({
  __esModule: true,
  default: {
    check: jest.fn().mockResolvedValue({
      success: true,
      remaining: 99,
      resetTime: Date.now() + 60_000,
      limit: 100,
    }),
  },
  RATE_LIMITS: {
    AUTH: { limit: 5, windowMs: 60_000 },
    API: { limit: 100, windowMs: 60_000 },
  },
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
}))

const VICTIM_ID = '550e8400-e29b-41d4-a716-446655440000'
const REAL_USER_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

const SPOOFED_HEADERS = {
  'x-user-id': VICTIM_ID,
  'x-user-email': 'victim@example.com',
  'x-user-name': 'Victim',
}

/**
 * Rebuild the header set a route handler receives after the proxy runs.
 * NextResponse.next({ request: { headers } }) lists every forwarded header in
 * x-middleware-override-headers; anything missing from that list is dropped.
 */
function forwardedRequest(response: Response, url: string): NextRequest {
  const override = response.headers.get('x-middleware-override-headers')
  expect(override).not.toBeNull()

  const headers = new Headers()
  for (const name of override!.split(',')) {
    const value = response.headers.get(`x-middleware-request-${name}`)
    if (value !== null) {
      headers.set(name, value)
    }
  }
  return new NextRequest(url, { headers })
}

describe('proxy identity headers', () => {
  it.each([
    'http://localhost/api/assessments',
    'http://localhost/api/assessments/python-basics',
    'http://localhost/api/leaderboards',
    'http://localhost/api/solutions?lessonId=l1',
  ])('strips spoofed x-user-* headers on anonymous GET %s', async (url) => {
    const request = new NextRequest(url, { headers: SPOOFED_HEADERS })

    const response = await proxy(request)
    const downstream = forwardedRequest(response, url)

    expect(downstream.headers.get('x-user-id')).toBeNull()
    expect(downstream.headers.get('x-user-email')).toBeNull()
    expect(downstream.headers.get('x-user-name')).toBeNull()
    expect(() => getAuthenticatedUserId(downstream)).toThrow(
      'Authentication required'
    )
  })

  it('replaces spoofed headers with the verified JWT identity', async () => {
    const token = 'token-with-name'
    mockVerifiedTokens[token] = {
      userId: REAL_USER_ID,
      email: 'real@example.com',
      name: 'Real User',
      role: 'student',
      emailVerified: true,
    }
    const url = 'http://localhost/api/assessments'
    const request = new NextRequest(url, {
      headers: { ...SPOOFED_HEADERS, authorization: `Bearer ${token}` },
    })

    const response = await proxy(request)
    const downstream = forwardedRequest(response, url)

    expect(downstream.headers.get('x-user-id')).toBe(REAL_USER_ID)
    expect(downstream.headers.get('x-user-email')).toBe('real@example.com')
    expect(downstream.headers.get('x-user-name')).toBe('Real User')
    expect(getAuthenticatedUserId(downstream)).toBe(REAL_USER_ID)
  })

  it('does not keep a spoofed x-user-name when the verified user has none', async () => {
    const token = 'token-without-name'
    mockVerifiedTokens[token] = {
      userId: REAL_USER_ID,
      email: 'real@example.com',
      role: 'student',
      emailVerified: true,
    }
    const url = 'http://localhost/api/leaderboards'
    const request = new NextRequest(url, {
      headers: { ...SPOOFED_HEADERS, authorization: `Bearer ${token}` },
    })

    const downstream = forwardedRequest(await proxy(request), url)

    expect(downstream.headers.get('x-user-id')).toBe(REAL_USER_ID)
    expect(downstream.headers.get('x-user-name')).toBeNull()
  })

  it.each([
    'http://localhost/api/auth/me',
    'http://localhost/api/health',
    'http://localhost/api/stripe/webhook',
    'http://localhost/dashboard',
  ])('strips spoofed x-user-* headers outside the API auth branch: %s', async (url) => {
    const request = new NextRequest(url, { headers: SPOOFED_HEADERS })

    const downstream = forwardedRequest(await proxy(request), url)

    expect(downstream.headers.get('x-user-id')).toBeNull()
    expect(downstream.headers.get('x-user-email')).toBeNull()
    expect(downstream.headers.get('x-user-name')).toBeNull()
  })

  it('treats a forged bearer token as anonymous', async () => {
    const url = 'http://localhost/api/assessments'
    const request = new NextRequest(url, {
      headers: { ...SPOOFED_HEADERS, authorization: 'Bearer forged' },
    })

    const downstream = forwardedRequest(await proxy(request), url)

    expect(downstream.headers.get('x-user-id')).toBeNull()
  })

  it('still rejects anonymous requests to protected routes', async () => {
    const request = new NextRequest('http://localhost/api/progress/lessons', {
      headers: SPOOFED_HEADERS,
    })

    const response = await proxy(request)

    expect(response.status).toBe(401)
  })
})
