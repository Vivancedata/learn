import { NextRequest } from 'next/server'
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  hasRole,
  getUserId,
  requireAuth,
  requireRole,
  setAuthCookie,
  getAuthToken,
  clearAuthCookie,
  getCurrentUser,
  getAuthUser,
  JWTPayload,
  UserRole,
} from '../auth'

// Mock jose module
const mockSign = jest.fn().mockResolvedValue('mock-jwt-token')
const mockJwtVerify = jest.fn()

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: () => mockSign(),
  })),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}))

// Mock next/headers - needs to be inline to avoid hoisting issues
const mockCookiesGet = jest.fn()
const mockCookiesSet = jest.fn()
const mockCookiesDelete = jest.fn()

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(async () => ({
    get: mockCookiesGet,
    set: mockCookiesSet,
    delete: mockCookiesDelete,
  })),
}))

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockJwtVerify.mockReset()
    mockSign.mockReset()
    mockSign.mockResolvedValue('mock-jwt-token')
  })

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123'
      const hashedPassword = await hashPassword(password)
      const isMatch = await comparePassword(password, hashedPassword)

      expect(isMatch).toBe(true)
    })

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123'
      const wrongPassword = 'WrongPassword456'
      const hashedPassword = await hashPassword(password)
      const isMatch = await comparePassword(wrongPassword, hashedPassword)

      expect(isMatch).toBe(false)
    })

    it('should handle empty password', async () => {
      const password = 'TestPassword123'
      const hashedPassword = await hashPassword(password)
      const isMatch = await comparePassword('', hashedPassword)

      expect(isMatch).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a JWT token', async () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        emailVerified: false,
      }

      const token = await generateToken(payload)

      expect(token).toBe('mock-jwt-token')
      expect(mockSign).toHaveBeenCalled()
    })

    it('should handle payload without name', async () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'student',
        emailVerified: false,
      }

      const token = await generateToken(payload)

      expect(token).toBe('mock-jwt-token')
    })
  })

  describe('verifyToken', () => {
    it('should verify and return payload for valid token', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'student',
        emailVerified: true,
      }
      mockJwtVerify.mockResolvedValueOnce({ payload: mockPayload })

      const result = await verifyToken('valid-token')

      expect(result).toEqual(mockPayload)
    })

    it('should return null for invalid token', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'))

      const result = await verifyToken('invalid-token')

      expect(result).toBeNull()
    })

    it('should return null for expired token', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('Token expired'))

      const result = await verifyToken('expired-token')

      expect(result).toBeNull()
    })
  })

  describe('hasRole', () => {
    it('should return true when user has required role', () => {
      expect(hasRole('admin', ['admin', 'instructor'])).toBe(true)
      expect(hasRole('instructor', ['admin', 'instructor'])).toBe(true)
      expect(hasRole('student', ['student'])).toBe(true)
    })

    it('should return false when user does not have required role', () => {
      expect(hasRole('student', ['admin', 'instructor'])).toBe(false)
      expect(hasRole('student', ['admin'])).toBe(false)
    })

    it('should handle empty required roles array', () => {
      expect(hasRole('student', [])).toBe(false)
    })
  })

  describe('getUserId', () => {
    it('should return user ID from request headers', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-user-id': 'user-123' },
      })

      const userId = getUserId(request)

      expect(userId).toBe('user-123')
    })

    it('should return null when x-user-id header is missing', () => {
      const request = new NextRequest('http://localhost/api/test')

      const userId = getUserId(request)

      expect(userId).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return user session from Authorization header', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student' as UserRole,
      }
      mockJwtVerify.mockResolvedValueOnce({ payload: mockPayload })

      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      })

      const session = await requireAuth(request)

      expect(session).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        emailVerified: false,
      })
    })

    it('should throw error when not authenticated', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'))
      mockCookiesGet.mockReturnValueOnce(undefined)

      const request = new NextRequest('http://localhost/api/test')

      await expect(requireAuth(request)).rejects.toThrow('Unauthorized')
    })
  })

  describe('requireRole', () => {
    beforeEach(() => {
      mockJwtVerify.mockReset()
    })

    it('should return session when user has required role', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'admin' as UserRole,
      }
      mockJwtVerify.mockResolvedValue({ payload: mockPayload })

      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      })

      const session = await requireRole(request, ['admin'])

      expect(session.role).toBe('admin')
    })

    it('should throw ForbiddenError when user lacks required role', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'student@example.com',
        role: 'student' as UserRole,
      }
      mockJwtVerify.mockResolvedValue({ payload: mockPayload })

      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      })

      await expect(requireRole(request, ['admin'])).rejects.toThrow(
        'Requires one of: admin'
      )
    })
  })

  describe('setAuthCookie', () => {
    it('should set auth cookie with correct options', async () => {
      await setAuthCookie('test-token')

      expect(mockCookiesSet).toHaveBeenCalledWith('auth-token', 'test-token', {
        httpOnly: true,
        secure: false, // NODE_ENV is not production in tests
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    })
  })

  describe('getAuthToken', () => {
    it('should return token when cookie exists', async () => {
      mockCookiesGet.mockReturnValueOnce({ value: 'stored-token' })

      const token = await getAuthToken()

      expect(token).toBe('stored-token')
      expect(mockCookiesGet).toHaveBeenCalledWith('auth-token')
    })

    it('should return null when cookie does not exist', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined)

      const token = await getAuthToken()

      expect(token).toBeNull()
    })
  })

  describe('clearAuthCookie', () => {
    it('should delete auth cookie', async () => {
      await clearAuthCookie()

      expect(mockCookiesDelete).toHaveBeenCalledWith('auth-token')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user session when valid token in cookie', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student' as UserRole,
      }
      mockCookiesGet.mockReturnValueOnce({ value: 'valid-token' })
      mockJwtVerify.mockResolvedValueOnce({ payload: mockPayload })

      const user = await getCurrentUser()

      expect(user).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        emailVerified: false,
      })
    })

    it('should return null when no token in cookie', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined)

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should return null when token is invalid', async () => {
      mockCookiesGet.mockReturnValueOnce({ value: 'invalid-token' })
      mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'))

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })
  })

  describe('getAuthUser', () => {
    it('should return user from Authorization header', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student' as UserRole,
      }
      mockJwtVerify.mockResolvedValueOnce({ payload: mockPayload })

      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer valid-token' },
      })

      const user = await getAuthUser(request)

      expect(user).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        emailVerified: false,
      })
    })

    it('should fallback to cookie when Authorization header is invalid', async () => {
      const mockPayload = {
        userId: 'user-456',
        email: 'cookie@example.com',
        role: 'instructor' as UserRole,
      }
      // First call fails (Authorization header token invalid)
      mockJwtVerify.mockRejectedValueOnce(new Error('Invalid token'))
      // Second call succeeds (cookie token valid)
      mockJwtVerify.mockResolvedValueOnce({ payload: mockPayload })
      mockCookiesGet.mockReturnValueOnce({ value: 'cookie-token' })

      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer invalid-token' },
      })

      const user = await getAuthUser(request)

      expect(user).toEqual({
        userId: 'user-456',
        email: 'cookie@example.com',
        name: undefined,
        role: 'instructor',
        emailVerified: false,
      })
    })

    it('should fallback to cookie when no Authorization header', async () => {
      const mockPayload = {
        userId: 'user-789',
        email: 'nocookie@example.com',
        role: 'admin' as UserRole,
      }
      mockCookiesGet.mockReturnValueOnce({ value: 'cookie-token' })
      mockJwtVerify.mockResolvedValueOnce({ payload: mockPayload })

      const request = new NextRequest('http://localhost/api/test')

      const user = await getAuthUser(request)

      expect(user).toEqual({
        userId: 'user-789',
        email: 'nocookie@example.com',
        name: undefined,
        role: 'admin',
        emailVerified: false,
      })
    })

    it('should return null when both Authorization and cookie fail', async () => {
      mockJwtVerify.mockRejectedValue(new Error('Invalid token'))
      mockCookiesGet.mockReturnValueOnce({ value: 'invalid-cookie' })

      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer invalid-token' },
      })

      const user = await getAuthUser(request)

      expect(user).toBeNull()
    })

    it('should return null when no auth sources available', async () => {
      mockCookiesGet.mockReturnValueOnce(undefined)

      const request = new NextRequest('http://localhost/api/test')

      const user = await getAuthUser(request)

      expect(user).toBeNull()
    })
  })
})
