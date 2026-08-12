import { NextRequest } from 'next/server'
import { POST as signup } from '../auth/signup/route'
import prisma from '@/lib/db'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email'

// Mock the Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest
    .fn()
    .mockReturnValue({ success: true, remaining: 99, resetTime: Date.now() + 60000 }),
  getClientIdentifier: jest.fn().mockReturnValue('test-client'),
  RATE_LIMITS: { AUTH: 'auth', API: 'api' },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  generateToken: jest.fn().mockResolvedValue('test-jwt-token'),
  setAuthCookie: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email-verification', () => ({
  createEmailVerificationToken: jest.fn().mockResolvedValue({
    verificationCode: '123456',
    expiresAt: new Date('2099-01-01T00:00:00Z'),
  }),
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
  isEmailServiceConfigured: jest.fn(),
}))

jest.mock('@/lib/app-url', () => ({
  getAppUrl: jest.fn().mockReturnValue('https://learn.example.com'),
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>
const mockedSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>
const mockedIsConfigured = isEmailServiceConfigured as jest.MockedFunction<
  typeof isEmailServiceConfigured
>

const createdUser = {
  id: 'user-1',
  email: 'new@example.com',
  name: 'New User',
  githubUsername: null,
  role: 'student',
  emailVerified: false,
}

function signupRequest(): NextRequest {
  return new NextRequest('http://localhost/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: 'new@example.com',
      password: 'Test1234',
      name: 'New User',
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/signup email fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockedPrisma.user.create as jest.Mock).mockResolvedValue(createdUser)
  })

  it('creates the account and exposes the verification code when no email service is configured', async () => {
    mockedIsConfigured.mockReturnValue(false)
    mockedSendEmail.mockRejectedValue(new Error('Email service is not configured'))

    const response = await signup(signupRequest())
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.user.email).toBe('new@example.com')
    expect(body.data.verificationCode).toBe('123456')
    // An unconfigured service must not even be attempted
    expect(mockedSendEmail).not.toHaveBeenCalled()
  })

  it('still creates the account when a configured email service fails to send', async () => {
    mockedIsConfigured.mockReturnValue(true)
    mockedSendEmail.mockRejectedValue(new Error('Resend 500'))

    const response = await signup(signupRequest())
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.user.email).toBe('new@example.com')
    expect(mockedSendEmail).toHaveBeenCalledTimes(1)
  })

  it('sends the verification email when the service is configured', async () => {
    mockedIsConfigured.mockReturnValue(true)
    mockedSendEmail.mockResolvedValue(undefined as never)

    const response = await signup(signupRequest())

    expect(response.status).toBe(201)
    expect(mockedSendEmail).toHaveBeenCalledTimes(1)
  })
})
