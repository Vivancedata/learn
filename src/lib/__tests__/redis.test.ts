
// Mock @upstash/redis to avoid ESM issues
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
  })),
}))

// Save original env
const originalEnv = process.env

describe('Redis Client', () => {
  beforeEach(() => {
    // Reset modules to get fresh imports
    jest.resetModules()
    // Reset env
    process.env = { ...originalEnv }
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isRedisConfigured()', () => {
    it('should return false when no env vars are set', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isRedisConfigured } = require('../redis')
      expect(isRedisConfigured()).toBe(false)
    })

    it('should return false when only URL is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isRedisConfigured } = require('../redis')
      expect(isRedisConfigured()).toBe(false)
    })

    it('should return false when only token is set', () => {
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isRedisConfigured } = require('../redis')
      expect(isRedisConfigured()).toBe(false)
    })

    it('should return true when both env vars are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isRedisConfigured } = require('../redis')
      expect(isRedisConfigured()).toBe(true)
    })
  })

  describe('getRedisClient()', () => {
    it('should return null when Redis is not configured', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRedisClient } = require('../redis')
      const client = getRedisClient()
      expect(client).toBeNull()
    })

    it('should return Redis instance when configured', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRedisClient } = require('../redis')
      const client = getRedisClient()

      expect(client).not.toBeNull()
      expect(client).toBeDefined()
    })
  })

  describe('getRedis()', () => {
    it('should return null when not configured', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRedis } = require('../redis')
      const redis = getRedis()
      expect(redis).toBeNull()
    })

    it('should return the same instance on multiple calls (singleton)', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRedis } = require('../redis')
      const redis1 = getRedis()
      const redis2 = getRedis()

      expect(redis1).toBe(redis2)
    })
  })

  describe('checkRedisHealth()', () => {
    it('should return not_configured when Redis is not set up', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { checkRedisHealth } = require('../redis')
      const result = await checkRedisHealth()

      expect(result.connected).toBe(false)
      expect(result.error).toBe('Redis not configured')
    })

    it('should return connected when ping succeeds', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { checkRedisHealth } = require('../redis')
      const result = await checkRedisHealth()

      expect(result.connected).toBe(true)
      expect(result.latencyMs).toBeDefined()
    })
  })
})
