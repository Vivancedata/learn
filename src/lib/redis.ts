/**
 * Redis client configuration for distributed rate limiting
 *
 * Uses Upstash Redis for serverless-compatible distributed caching.
 * Upstash provides a REST-based Redis client that works in edge environments.
 *
 * Configuration (either naming scheme is supported):
 * - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * - KV_REST_API_URL / KV_REST_API_TOKEN
 *
 * @see https://upstash.com/docs/redis/overall/getstarted
 */

import { Redis } from '@upstash/redis'

function getRedisConfig():
  | { url: string; token: string }
  | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    return null
  }

  return { url, token }
}

/**
 * Check if Redis is configured via environment variables
 */
export function isRedisConfigured(): boolean {
  return getRedisConfig() !== null
}

/**
 * Get the Redis client instance
 *
 * Returns null if Redis is not configured. In development, this is acceptable
 * as the rate limiter will fall back to in-memory storage. In production,
 * this should be treated as a configuration error.
 *
 * @returns Redis client instance or null if not configured
 */
export function getRedisClient(): Redis | null {
  const redisConfig = getRedisConfig()
  if (!redisConfig) {
    return null
  }

  return new Redis({
    url: redisConfig.url,
    token: redisConfig.token,
  })
}

/**
 * Singleton Redis client for reuse across the application
 * Lazily initialized on first access
 */
let redisInstance: Redis | null | undefined = undefined

/**
 * Get or create the singleton Redis client instance
 *
 * This function lazily initializes the Redis client on first call
 * and returns the same instance on subsequent calls.
 *
 * @returns Redis client instance or null if not configured
 */
export function getRedis(): Redis | null {
  if (redisInstance === undefined) {
    redisInstance = getRedisClient()
  }
  return redisInstance
}

/**
 * Check Redis connectivity
 *
 * Performs a PING command to verify the Redis connection is working.
 * Useful for health checks and startup validation.
 *
 * @returns Object with connected status and optional error message
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean
  latencyMs?: number
  error?: string
}> {
  const redis = getRedis()

  if (!redis) {
    return {
      connected: false,
      error: 'Redis not configured',
    }
  }

  try {
    const startTime = Date.now()
    const result = await redis.ping()
    const latencyMs = Date.now() - startTime

    if (result === 'PONG') {
      return {
        connected: true,
        latencyMs,
      }
    }

    return {
      connected: false,
      error: `Unexpected PING response: ${result}`,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Export the Redis type for use in other modules
export type { Redis }
