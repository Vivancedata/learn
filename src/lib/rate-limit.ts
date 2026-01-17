/**
 * Simple in-memory rate limiter
 *
 * LIMITATIONS:
 * - In-memory storage: Rate limit state is lost on server restart
 * - Single-instance only: Does NOT work across multiple server instances
 * - Not suitable for serverless (Vercel, AWS Lambda) due to ephemeral memory
 *
 * PRODUCTION RECOMMENDATIONS:
 * For production deployments with multiple instances or serverless:
 * 1. Use Redis-based rate limiting:
 *    - @upstash/ratelimit for Vercel Edge/serverless
 *    - ioredis + sliding window algorithm for Node.js
 * 2. Use CDN-level rate limiting (Cloudflare, AWS WAF)
 * 3. Consider API Gateway rate limiting (Kong, AWS API Gateway)
 *
 * Example Redis implementation:
 * ```typescript
 * import { Ratelimit } from '@upstash/ratelimit'
 * import { Redis } from '@upstash/redis'
 *
 * const ratelimit = new Ratelimit({
 *   redis: Redis.fromEnv(),
 *   limiter: Ratelimit.slidingWindow(100, '15 m'),
 * })
 * ```
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key)
      }
    }
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with success status and remaining attempts
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): {
    success: boolean
    remaining: number
    resetTime: number
  } {
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
      }
    }

    // Entry exists and is still valid
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    // Increment count
    entry.count++
    this.storage.set(identifier, entry)

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.storage.delete(identifier)
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.storage.clear()
  }

  /**
   * Cleanup and stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

export default rateLimiter

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    limit: 5, // 5 requests
    windowMs: 15 * 60 * 1000, // per 15 minutes
  },
  // API endpoints - moderate limits
  API: {
    limit: 100, // 100 requests
    windowMs: 15 * 60 * 1000, // per 15 minutes
  },
  // General - lenient limits
  GENERAL: {
    limit: 1000, // 1000 requests
    windowMs: 15 * 60 * 1000, // per 15 minutes
  },
} as const
