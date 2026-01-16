import { NextResponse } from 'next/server'

/**
 * Standardized API response helpers
 *
 * Success format: { data: T, success: true }
 * Error format: { error: string, success: false }
 *
 * Usage:
 *   return apiSuccess(data)
 *   return apiSuccess(data, 201)
 *   return apiError('Not found', 404)
 *   return apiError('Server error', 500)
 */

interface SuccessResponse<T> {
  data: T
  success: true
}

interface ErrorResponse {
  error: string
  success: false
}

type ApiResponseHeaders = Record<string, string>

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
  headers?: ApiResponseHeaders
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    { data, success: true as const },
    { status, headers }
  )
}

/**
 * Create an error API response
 */
export function apiError(
  error: string,
  status = 400,
  headers?: ApiResponseHeaders
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { error, success: false as const },
    { status, headers }
  )
}

/**
 * Create a paginated success response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore?: boolean
  },
  status = 200
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      ...pagination,
      hasMore: pagination.hasMore ?? pagination.offset + pagination.limit < pagination.total,
    },
    success: true,
  }, { status })
}

/**
 * Rate limit error with proper headers
 */
export function apiRateLimited(
  rateLimitResult: { limit: number; remaining: number; resetTime: number }
): NextResponse<ErrorResponse> {
  return apiError('Too many requests. Please try again later.', 429, {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
  })
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => apiError('Unauthorized', 401),
  forbidden: () => apiError('Forbidden', 403),
  notFound: (resource = 'Resource') => apiError(`${resource} not found`, 404),
  validation: (message: string) => apiError(message, 400),
  internal: (message = 'Internal server error') => apiError(message, 500),
} as const

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(
  response: SuccessResponse<T> | ErrorResponse
): response is SuccessResponse<T> {
  return response.success === true
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(
  response: SuccessResponse<unknown> | ErrorResponse
): response is ErrorResponse {
  return response.success === false
}
