
// Mock @upstash modules to avoid ESM issues
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}))

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: {
    slidingWindow: jest.fn(),
  },
}))

// Mock the redis module to prevent Redis connection attempts during tests
jest.mock('../redis', () => ({
  isRedisConfigured: jest.fn().mockReturnValue(false),
  getRedis: jest.fn().mockReturnValue(null),
}))

import rateLimiter, {
  RATE_LIMITS,
  getClientIdentifier,
  checkRateLimit,
  checkRateLimitSync,
  getRateLimitHeaders,
  RateLimitResult,
} from '../rate-limit'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset the rate limiter between tests
    rateLimiter.destroy()
  })

  afterAll(() => {
    // Clean up after all tests
    rateLimiter.destroy()
  })

  describe('RATE_LIMITS configuration', () => {
    it('should have correct AUTH limits', () => {
      expect(RATE_LIMITS.AUTH.limit).toBe(5)
      expect(RATE_LIMITS.AUTH.windowMs).toBe(15 * 60 * 1000)
      expect(RATE_LIMITS.AUTH.windowSeconds).toBe(15 * 60)
    })

    it('should have correct API limits', () => {
      expect(RATE_LIMITS.API.limit).toBe(100)
      expect(RATE_LIMITS.API.windowMs).toBe(15 * 60 * 1000)
      expect(RATE_LIMITS.API.windowSeconds).toBe(15 * 60)
    })

    it('should have correct GENERAL limits', () => {
      expect(RATE_LIMITS.GENERAL.limit).toBe(1000)
      expect(RATE_LIMITS.GENERAL.windowMs).toBe(15 * 60 * 1000)
      expect(RATE_LIMITS.GENERAL.windowSeconds).toBe(15 * 60)
    })
  })

  describe('rateLimiter.check() - async version', () => {
    it('should allow requests under the limit', async () => {
      const identifier = 'test-user-1'
      const limit = 5
      const windowMs = 60000

      const result = await rateLimiter.check(identifier, limit, windowMs)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(limit - 1)
      expect(result.limit).toBe(limit)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should decrement remaining count on each request', async () => {
      const identifier = 'test-user-2'
      const limit = 5
      const windowMs = 60000

      // Make multiple requests
      const result1 = await rateLimiter.check(identifier, limit, windowMs)
      const result2 = await rateLimiter.check(identifier, limit, windowMs)
      const result3 = await rateLimiter.check(identifier, limit, windowMs)

      expect(result1.remaining).toBe(4)
      expect(result2.remaining).toBe(3)
      expect(result3.remaining).toBe(2)
    })

    it('should block requests when limit is exceeded', async () => {
      const identifier = 'test-user-3'
      const limit = 3
      const windowMs = 60000

      // Exhaust the limit
      await rateLimiter.check(identifier, limit, windowMs)
      await rateLimiter.check(identifier, limit, windowMs)
      await rateLimiter.check(identifier, limit, windowMs)

      // This request should be blocked
      const result = await rateLimiter.check(identifier, limit, windowMs)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track different identifiers separately', async () => {
      const limit = 3
      const windowMs = 60000

      // User A makes requests
      await rateLimiter.check('user-a', limit, windowMs)
      await rateLimiter.check('user-a', limit, windowMs)
      const resultA = await rateLimiter.check('user-a', limit, windowMs)

      // User B should have full limit
      const resultB = await rateLimiter.check('user-b', limit, windowMs)

      expect(resultA.remaining).toBe(0)
      expect(resultB.remaining).toBe(2) // First request, so 3-1=2
    })

    it('should include limit in result', async () => {
      const identifier = 'test-user-4'
      const limit = 10
      const windowMs = 60000

      const result = await rateLimiter.check(identifier, limit, windowMs)

      expect(result.limit).toBe(limit)
    })
  })

  describe('rateLimiter.checkSync() - sync version (deprecated)', () => {
    it('should work for in-memory limiter', () => {
      const identifier = 'sync-test-1'
      const limit = 5
      const windowMs = 60000

      const result = rateLimiter.checkSync(identifier, limit, windowMs)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(limit - 1)
    })

    it('should block when limit exceeded', () => {
      const identifier = 'sync-test-2'
      const limit = 2
      const windowMs = 60000

      rateLimiter.checkSync(identifier, limit, windowMs)
      rateLimiter.checkSync(identifier, limit, windowMs)
      const result = rateLimiter.checkSync(identifier, limit, windowMs)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('rateLimiter.isUsingRedis()', () => {
    it('should return false when Redis is not configured', () => {
      expect(rateLimiter.isUsingRedis()).toBe(false)
    })
  })

  describe('rateLimiter.reset()', () => {
    it('should reset rate limit for a specific identifier', async () => {
      const identifier = 'reset-test'
      const limit = 3
      const windowMs = 60000

      // Exhaust the limit
      await rateLimiter.check(identifier, limit, windowMs)
      await rateLimiter.check(identifier, limit, windowMs)
      await rateLimiter.check(identifier, limit, windowMs)

      // Verify blocked
      const blocked = await rateLimiter.check(identifier, limit, windowMs)
      expect(blocked.success).toBe(false)

      // Reset
      rateLimiter.reset(identifier)

      // Should be allowed again
      const result = await rateLimiter.check(identifier, limit, windowMs)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(limit - 1)
    })
  })

  describe('rateLimiter.clear()', () => {
    it('should clear all rate limit data', async () => {
      const limit = 2
      const windowMs = 60000

      // Create entries for multiple identifiers
      await rateLimiter.check('clear-test-a', limit, windowMs)
      await rateLimiter.check('clear-test-a', limit, windowMs)
      await rateLimiter.check('clear-test-b', limit, windowMs)

      // Clear all
      rateLimiter.clear()

      // Both should have full limits
      const resultA = await rateLimiter.check('clear-test-a', limit, windowMs)
      const resultB = await rateLimiter.check('clear-test-b', limit, windowMs)

      expect(resultA.remaining).toBe(limit - 1)
      expect(resultB.remaining).toBe(limit - 1)
    })
  })

  describe('getClientIdentifier()', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
            return null
          },
        },
      }

      const identifier = getClientIdentifier(mockRequest)

      expect(identifier).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '10.0.0.2'
            return null
          },
        },
      }

      const identifier = getClientIdentifier(mockRequest)

      expect(identifier).toBe('10.0.0.2')
    })

    it('should return unknown-client when no IP headers are present', () => {
      const mockRequest = {
        headers: {
          get: () => null,
        },
      }

      const identifier = getClientIdentifier(mockRequest)

      expect(identifier).toBe('unknown-client')
    })

    it('should trim whitespace from IP address', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '  192.168.1.1  , 10.0.0.1'
            return null
          },
        },
      }

      const identifier = getClientIdentifier(mockRequest)

      expect(identifier).toBe('192.168.1.1')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            if (name === 'x-real-ip') return '10.0.0.2'
            return null
          },
        },
      }

      const identifier = getClientIdentifier(mockRequest)

      expect(identifier).toBe('192.168.1.1')
    })
  })

  describe('checkRateLimit() - async helper', () => {
    it('should check rate limit with config object', async () => {
      const identifier = 'helper-async-test'
      const config = { limit: 5, windowMs: 60000 }

      const result = await checkRateLimit(identifier, config)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    it('should use AUTH rate limit config', async () => {
      const identifier = 'auth-config-test'

      const result = await checkRateLimit(identifier, RATE_LIMITS.AUTH)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(RATE_LIMITS.AUTH.limit)
    })
  })

  describe('checkRateLimitSync() - sync helper (deprecated)', () => {
    it('should check rate limit synchronously', () => {
      const identifier = 'helper-sync-test'
      const config = { limit: 5, windowMs: 60000 }

      const result = checkRateLimitSync(identifier, config)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })
  })

  describe('getRateLimitHeaders()', () => {
    it('should generate headers for successful request', () => {
      const result: RateLimitResult = {
        success: true,
        remaining: 95,
        resetTime: Date.now() + 60000,
        limit: 100,
      }

      const headers = getRateLimitHeaders(result)

      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('95')
      expect(headers['X-RateLimit-Reset']).toBeDefined()
      expect(headers['Retry-After']).toBeUndefined()
    })

    it('should include Retry-After header for blocked request', () => {
      const resetTime = Date.now() + 30000 // 30 seconds from now
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        resetTime,
        limit: 100,
      }

      const headers = getRateLimitHeaders(result)

      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('0')
      expect(headers['Retry-After']).toBeDefined()
      expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0)
      expect(parseInt(headers['Retry-After'])).toBeLessThanOrEqual(30)
    })

    it('should format reset time as ISO string', () => {
      const resetTime = new Date('2025-01-01T12:00:00.000Z').getTime()
      const result: RateLimitResult = {
        success: true,
        remaining: 50,
        resetTime,
        limit: 100,
      }

      const headers = getRateLimitHeaders(result)

      expect(headers['X-RateLimit-Reset']).toBe('2025-01-01T12:00:00.000Z')
    })

    it('should handle edge case where resetTime is in the past', () => {
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        resetTime: Date.now() - 1000, // 1 second ago
        limit: 100,
      }

      const headers = getRateLimitHeaders(result)

      // Retry-After should be 0 or not negative
      expect(parseInt(headers['Retry-After'])).toBe(0)
    })
  })

  describe('Window expiration', () => {
    // Note: These tests use small windows for testing purposes
    it('should allow requests after window expires', async () => {
      const identifier = 'expiration-test'
      const limit = 2
      const windowMs = 100 // 100ms for fast test

      // Exhaust the limit
      await rateLimiter.check(identifier, limit, windowMs)
      await rateLimiter.check(identifier, limit, windowMs)

      // Should be blocked
      const blocked = await rateLimiter.check(identifier, limit, windowMs)
      expect(blocked.success).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const result = await rateLimiter.check(identifier, limit, windowMs)
      expect(result.success).toBe(true)
    })
  })
})

describe('Rate Limiter with Redis mock', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should detect when Redis is not configured', () => {
    // The mock sets isRedisConfigured to false
    const { isRedisConfigured } = jest.requireMock('../redis')
    expect(isRedisConfigured()).toBe(false)
  })
})
