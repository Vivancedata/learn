import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import rateLimiter, { RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Enable browser XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

/**
 * Next.js middleware for authentication, rate limiting, and security
 * Protects API routes (except auth endpoints) by requiring authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIp = getClientIp(request)

  // Apply rate limiting to auth endpoints (stricter)
  if (pathname.startsWith('/api/auth/')) {
    const { success, remaining, resetTime } = rateLimiter.check(
      `auth:${clientIp}`,
      RATE_LIMITS.AUTH.limit,
      RATE_LIMITS.AUTH.windowMs
    )

    if (!success) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Too many authentication attempts. Please try again later.',
          timestamp: new Date().toISOString(),
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMITS.AUTH.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS.AUTH.limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())

    return addSecurityHeaders(response)
  }

  // Apply rate limiting to other API routes (excluding auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const { success, remaining, resetTime } = rateLimiter.check(
      `api:${clientIp}`,
      RATE_LIMITS.API.limit,
      RATE_LIMITS.API.windowMs
    )

    if (!success) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString(),
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMITS.API.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      )
    }

    // Check authentication for protected API routes
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in.',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }

    // Add user info and rate limit headers to request
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.userId)
    requestHeaders.set('x-user-email', user.email)
    if (user.name) {
      requestHeaders.set('x-user-name', user.name)
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    response.headers.set('X-RateLimit-Limit', RATE_LIMITS.API.limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())

    return addSecurityHeaders(response)
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
