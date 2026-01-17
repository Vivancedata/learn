/**
 * CORS (Cross-Origin Resource Sharing) configuration and utilities
 * Controls which origins can access the API
 */

import { NextResponse } from 'next/server'

/**
 * Allowed origins for CORS
 * In production, this should come from environment variables
 */
const ALLOWED_ORIGINS =
  process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ]

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false

  // In development, allow all localhost origins
  if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
    return true
  }

  return ALLOWED_ORIGINS.includes(origin)
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    )
    response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
  }

  return response
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(origin: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 })

  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    )
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

/**
 * CORS configuration object for use in API routes
 */
export const corsConfig = {
  allowedOrigins: ALLOWED_ORIGINS,
  allowCredentials: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
} as const
