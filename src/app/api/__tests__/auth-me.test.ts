/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/me/route'
import { requireAuth } from '@/lib/auth'
import { UnauthorizedError } from '@/lib/api-errors'

// jest.setup.js mocks next/server; the route needs real request cookies.
jest.unmock('next/server')

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() } },
}))

const mockRequireAuth = requireAuth as jest.Mock

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 with user: null when the request has no credentials', async () => {
    const response = await GET(new NextRequest('http://localhost/api/auth/me'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({ user: null })
    expect(mockRequireAuth).not.toHaveBeenCalled()
  })

  it('keeps 401 when a cookie is present but the session is invalid', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Please sign in'))

    const response = await GET(
      new NextRequest('http://localhost/api/auth/me', {
        headers: { cookie: 'auth-token=expired' },
      })
    )

    expect(response.status).toBe(401)
    expect(mockRequireAuth).toHaveBeenCalled()
  })

  it('keeps 401 when a bearer token is present but invalid', async () => {
    mockRequireAuth.mockRejectedValue(new UnauthorizedError('Please sign in'))

    const response = await GET(
      new NextRequest('http://localhost/api/auth/me', {
        headers: { authorization: 'Bearer forged' },
      })
    )

    expect(response.status).toBe(401)
  })
})
