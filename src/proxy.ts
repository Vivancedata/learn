import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import rateLimiter, { RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit'

const PUBLIC_READONLY_API_PATTERNS = [
  /^\/api\/courses\/?$/,
  /^\/api\/paths\/?$/,
]

function isPublicReadonlyApi(request: NextRequest, pathname: string): boolean {
  if (request.method !== 'GET') {
    return false
  }

  return PUBLIC_READONLY_API_PATTERNS.some((pattern) => pattern.test(pathname))
}

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
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

/**
 * Next.js proxy for authentication, rate limiting, and security
 * Protects API routes (except auth endpoints) by requiring authentication
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIp = getClientIp(request)

  // Apply rate limiting to auth endpoints (stricter)
  if (pathname.startsWith('/api/auth/')) {
    const rateLimitResult = await rateLimiter.check(
      `auth:${clientIp}`,
      RATE_LIMITS.AUTH.limit,
      RATE_LIMITS.AUTH.windowMs
    )

    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Too many authentication attempts. Please try again later.',
          timestamp: new Date().toISOString(),
          retryAfter: parseInt(rateLimitHeaders['Retry-After'] || '0', 10),
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      )
    }

    const response = NextResponse.next()
    addRateLimitHeaders(response, rateLimitHeaders)
    return addSecurityHeaders(response)
  }

  // Skip rate limiting and auth for health endpoint
  if (pathname === '/api/health') {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Skip auth for Stripe webhook (Stripe authenticates via signature)
  if (pathname === '/api/stripe/webhook') {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Apply rate limiting to all other API routes.
  // Public read-only endpoints bypass auth, while sensitive routes require auth.
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const rateLimitResult = await rateLimiter.check(
      `api:${clientIp}`,
      RATE_LIMITS.API.limit,
      RATE_LIMITS.API.windowMs
    )

    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString(),
          retryAfter: parseInt(rateLimitHeaders['Retry-After'] || '0', 10),
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      )
    }

    const isPublicReadonly = isPublicReadonlyApi(request, pathname)

    let response: NextResponse

    if (!isPublicReadonly) {
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

      if (!user.emailVerified) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Email verification required.',
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        )
      }

      // Add user info and rate limit headers to request
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user.userId)
      requestHeaders.set('x-user-email', user.email)
      if (user.name) {
        requestHeaders.set('x-user-name', user.name)
      }

      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } else {
      response = NextResponse.next()
    }

    addRateLimitHeaders(response, rateLimitHeaders)
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
