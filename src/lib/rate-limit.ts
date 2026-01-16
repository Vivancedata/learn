/**
 * Simple in-memory rate limiter for API routes
 * For production with multiple instances, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP + userId)
 * @param options - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowSeconds } = options
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const existing = rateLimitStore.get(identifier)

  // If no existing entry or window has expired, create new entry
  if (!existing || now > existing.resetTime) {
    const resetTime = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime,
    }
  }

  // Increment count
  existing.count++
  rateLimitStore.set(identifier, existing)

  // Check if over limit
  if (existing.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: existing.resetTime,
    }
  }

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetTime: existing.resetTime,
  }
}

/**
 * Get client identifier from request
 * Combines IP address with optional user ID for per-user limits
 */
export function getClientIdentifier(
  request: Request,
  userId?: string | null
): string {
  // Try to get real IP from various headers (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'

  // Combine with userId if available for per-user limiting
  return userId ? `${ip}:${userId}` : ip
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Standard POST/PATCH/DELETE endpoints
  mutation: { limit: 30, windowSeconds: 60 },
  // Auth-related endpoints
  auth: { limit: 10, windowSeconds: 60 },
  // Search/list endpoints
  query: { limit: 100, windowSeconds: 60 },
} as const
