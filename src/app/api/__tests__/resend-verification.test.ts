import { NextRequest } from 'next/server'
import { POST as resendVerification } from '../auth/resend-verification/route'
import prisma from '@/lib/db'
import { isEmailServiceConfigured } from '@/lib/email'

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    emailVerificationToken: { findFirst: jest.fn() },
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimitAsync: jest
    .fn()
    .mockResolvedValue({ success: true, remaining: 4, resetTime: Date.now() + 60000 }),
  getClientIdentifier: jest.fn().mockReturnValue('test-client'),
  RATE_LIMITS: { AUTH_EMAIL: 'auth-email' },
}))

jest.mock('@/lib/email-verification', () => ({
  createEmailVerificationToken: jest.fn().mockResolvedValue({
    verificationCode: '123456',
    expiresAt: new Date('2099-01-01T00:00:00Z'),
  }),
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  isEmailServiceConfigured: jest.fn(),
}))

jest.mock('@/lib/app-url', () => ({
  getAppUrl: jest.fn().mockReturnValue('https://learn.example.com'),
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>
const mockedIsConfigured = isEmailServiceConfigured as jest.MockedFunction<
  typeof isEmailServiceConfigured
>
const env = process.env as Record<string, string | undefined>
const originalNodeEnv = env.NODE_ENV

function resendRequest(body: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/resend-verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'victim-1',
      email: 'victim@example.com',
      emailVerified: false,
    })
    ;(mockedPrisma.emailVerificationToken.findFirst as jest.Mock).mockResolvedValue(null)
  })

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv
  })

  // Anyone can call this route with another person's email, and
  // /api/auth/verify-email exchanges the code for a session: returning it
  // in production would hand over the account.
  it('never returns the code in production, even without an email service', async () => {
    env.NODE_ENV = 'production'
    mockedIsConfigured.mockReturnValue(false)

    const response = await resendVerification(resendRequest({ email: 'victim@example.com' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.verificationCode).toBeUndefined()
  })

  it('returns the code outside production so local development works without email', async () => {
    env.NODE_ENV = 'development'
    mockedIsConfigured.mockReturnValue(false)

    const response = await resendVerification(resendRequest({ email: 'victim@example.com' }))
    const body = await response.json()

    expect(body.data.verificationCode).toBe('123456')
  })
})
