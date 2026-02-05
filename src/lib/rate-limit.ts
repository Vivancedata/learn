/**
 * Distributed Rate Limiter with Redis backend
 *
 * Uses Upstash Redis for production-ready distributed rate limiting that:
 * - Persists across server restarts
 * - Works across multiple instances
 * - Supports serverless environments (Vercel, AWS Lambda)
 *
 * Falls back to in-memory storage in development when Redis is not configured.
 *
 * Configuration:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST API URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST API token
 * - NODE_ENV: Set to 'production' to require Redis configuration
 */

import { Ratelimit } from '@upstash/ratelimit'
import { getRedis, isRedisConfigured } from '@/lib/redis'

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits to prevent brute force
  AUTH: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    windowSeconds: 15 * 60,
  },
  // Email-related auth flows (forgot password, resend verification)
  AUTH_EMAIL: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 60 minutes
    windowSeconds: 60 * 60,
  },
  // API endpoints - moderate limits for normal usage
  API: {
    limit: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    windowSeconds: 15 * 60,
  },
  // General endpoints - lenient limits
  GENERAL: {
    limit: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
    windowSeconds: 15 * 60,
  },
} as const

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  limit: number
}

/**
 * In-memory rate limiter entry
 */
interface InMemoryEntry {
  count: number
  resetTime: number
}

/**
 * In-memory rate limiter for development fallback
 *
 * WARNING: This implementation has significant limitations:
 * - State is lost on server restart
 * - Does NOT work across multiple instances
 * - Not suitable for serverless environments
 *
 * Only use this for local development without Redis.
 */
class InMemoryRateLimiter {
  private storage: Map<string, InMemoryEntry> = new Map()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 60000)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key)
      }
    }
  }

  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): RateLimitResult {
    const now = Date.now()
    const entry = this.storage.get(identifier)

    // No entry exists or entry has expired
    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs
      this.storage.set(identifier, {
        count: 1,
        resetTime,
      })
      return {
        success: true,
        remaining: limit - 1,
        resetTime,
        limit,
      }
    }

    // Entry exists and is still valid
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        limit,
      }
    }

    // Increment count
    entry.count++
    this.storage.set(identifier, entry)

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
      limit,
    }
  }

  reset(identifier: string): void {
    this.storage.delete(identifier)
  }

  clear(): void {
    this.storage.clear()
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

/**
 * Redis-based rate limiter using Upstash
 *
 * Uses sliding window algorithm for smooth rate limiting.
 * Each rate limit type (auth, api, general) has its own limiter instance.
 */
class RedisRateLimiter {
  private limiters: Map<string, Ratelimit> = new Map()

  private getLimiter(limit: number, windowSeconds: number): Ratelimit {
    const key = `${limit}:${windowSeconds}`

    if (!this.limiters.has(key)) {
      const redis = getRedis()
      if (!redis) {
        throw new Error('Redis client not available')
      }

      this.limiters.set(
        key,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
          analytics: true,
          prefix: 'ratelimit',
        })
      )
    }

    return this.limiters.get(key)!
  }

  async check(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    try {
      const limiter = this.getLimiter(limit, windowSeconds)
      const result = await limiter.limit(identifier)

      return {
        success: result.success,
        remaining: result.remaining,
        resetTime: result.reset,
        limit: result.limit,
      }
    } catch (_error) {
      // Fail open to prevent blocking requests on Redis errors
      return {
        success: true,
        remaining: limit,
        resetTime: Date.now() + windowSeconds * 1000,
        limit,
      }
    }
  }
}

/**
 * Unified rate limiter that uses Redis in production and falls back to
 * in-memory in development when Redis is not configured.
 */
class RateLimiter {
  private inMemory: InMemoryRateLimiter | null = null
  private redis: RedisRateLimiter | null = null
  private initialized = false
  private useRedis = false

  private initialize(): void {
    if (this.initialized) return
    this.initialized = true

    const isProduction = process.env.NODE_ENV === 'production'
    const redisConfigured = isRedisConfigured()

    if (redisConfigured) {
      this.redis = new RedisRateLimiter()
      this.useRedis = true
    } else if (isProduction) {
      // In production, Redis MUST be configured
      throw new Error(
        'Redis is not configured. Rate limiting requires Redis in production. ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      )
    } else {
      // Development fallback to in-memory
      this.inMemory = new InMemoryRateLimiter()
      this.useRedis = false
      console.warn(
        '[RateLimit] WARNING: Using in-memory rate limiting (development only). ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed rate limiting.'
      )
    }
  }

  /**
   * Check if a request should be rate limited
   *
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Promise with rate limit result
   */
  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    this.initialize()

    const windowSeconds = Math.ceil(windowMs / 1000)

    if (this.useRedis && this.redis) {
      return this.redis.check(identifier, limit, windowSeconds)
    }

    if (this.inMemory) {
      return Promise.resolve(this.inMemory.check(identifier, limit, windowMs))
    }

    // Should not reach here, but fail open if it does
    return Promise.resolve({
      success: true,
      remaining: limit,
      resetTime: Date.now() + windowMs,
      limit,
    })
  }

  /**
   * Synchronous check - for backwards compatibility
   * Note: This only works with in-memory limiter
   *
   * @deprecated Use async check() instead
   */
  checkSync(
    identifier: string,
    limit: number,
    windowMs: number
  ): RateLimitResult {
    this.initialize()

    if (this.inMemory) {
      return this.inMemory.check(identifier, limit, windowMs)
    }

    // Redis requires async, return success for sync calls
    console.warn(
      '[RateLimit] checkSync() called with Redis backend. ' +
      'Use async check() instead for proper rate limiting.'
    )
    return {
      success: true,
      remaining: limit,
      resetTime: Date.now() + windowMs,
      limit,
    }
  }

  /**
   * Check if Redis is being used for rate limiting
   */
  isUsingRedis(): boolean {
    this.initialize()
    return this.useRedis
  }

  /**
   * Reset rate limit for a specific identifier
   * Only works with in-memory limiter (Redis handles expiry automatically)
   */
  reset(identifier: string): void {
    if (this.inMemory) {
      this.inMemory.reset(identifier)
    }
    // Redis entries expire automatically, no reset needed
  }

  /**
   * Clear all rate limit data
   * Only works with in-memory limiter
   */
  clear(): void {
    if (this.inMemory) {
      this.inMemory.clear()
    }
    // Cannot clear Redis without explicit key deletion
  }

  /**
   * Cleanup and stop background tasks
   */
  destroy(): void {
    if (this.inMemory) {
      this.inMemory.destroy()
      this.inMemory = null
    }
    this.redis = null
    this.initialized = false
    this.useRedis = false
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

export default rateLimiter

/**
 * Get client identifier from request for rate limiting
 * Uses IP address from headers with fallbacks
 *
 * @param request - Request object with headers
 * @returns Client identifier string
 */
export function getClientIdentifier(request: {
  headers: { get(name: string): string | null }
}): string {
  // Try common headers for client IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  return 'unknown-client'
}

/**
 * Check rate limit for a request (async version)
 *
 * @param identifier - Client identifier (e.g., IP address)
 * @param config - Rate limit configuration with limit and windowMs
 * @returns Promise with rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  return rateLimiter.check(identifier, config.limit, config.windowMs)
}

export async function checkRateLimitAsync(
  identifier: string,
  config: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, config)
}

/**
 * Check rate limit for a request (sync version, in-memory only)
 *
 * @deprecated Use async checkRateLimit() instead
 * @param identifier - Client identifier (e.g., IP address)
 * @param config - Rate limit configuration with limit and windowMs
 * @returns Rate limit result
 */
export function checkRateLimitSync(
  identifier: string,
  config: { limit: number; windowMs: number }
): RateLimitResult {
  return rateLimiter.checkSync(identifier, config.limit, config.windowMs)
}

/**
 * Generate rate limit headers for a response
 *
 * @param result - Rate limit check result
 * @returns Headers object with rate limit information
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }

  if (!result.success) {
    const retryAfter = Math.max(0, Math.ceil((result.resetTime - Date.now()) / 1000))
    headers['Retry-After'] = retryAfter.toString()
  }

  return headers
}
