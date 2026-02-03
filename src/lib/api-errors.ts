/**
 * Standardized API error handling utilities
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { formatZodErrors } from './validations'

/**
 * Sanitizes data by redacting sensitive fields before logging/reporting
 */
function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'creditCard',
    'credit_card',
    'cvv',
    'ssn',
    'social_security',
  ]

  const sanitized = { ...data } as Record<string, unknown>

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key])
    }
  }

  return sanitized
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface ApiErrorResponse {
  error: string
  message: string
  details?: unknown
  timestamp: string
}

export interface ApiSuccessResponse<T = unknown> {
  data: T
  timestamp: string
}

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const

// ============================================================================
// Error Classes
// ============================================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(HTTP_STATUS.BAD_REQUEST, message, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(HTTP_STATUS.NOT_FOUND, `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access') {
    super(HTTP_STATUS.UNAUTHORIZED, message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden') {
    super(HTTP_STATUS.FORBIDDEN, message)
    this.name = 'ForbiddenError'
  }
}

// ============================================================================
// Response Builders
// ============================================================================

/**
 * Creates a standardized success response
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized format
 */
export function apiSuccess<T>(
  data: T,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Creates a standardized error response
 * @param error - Error message or Error object
 * @param status - HTTP status code
 * @param details - Additional error details
 * @returns NextResponse with standardized error format
 */
export function apiError(
  error: string | Error,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const message = typeof error === 'string' ? error : error.message

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', {
      message,
      status,
      details,
      stack: typeof error !== 'string' ? error.stack : undefined,
    })
  }

  return NextResponse.json(
    {
      error: getErrorName(status),
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Handles Zod validation errors
 * @param zodError - Zod validation error
 * @returns NextResponse with formatted validation errors
 */
export function apiValidationError(
  zodError: z.ZodError
): NextResponse<ApiErrorResponse> {
  const formattedErrors = formatZodErrors(zodError)

  return apiError(
    'Validation failed',
    HTTP_STATUS.BAD_REQUEST,
    formattedErrors
  )
}

/**
 * Handles caught errors in API routes
 * Reports server errors to Sentry for monitoring
 * @param error - Any caught error
 * @param context - Optional context for error tracking
 * @returns NextResponse with appropriate error response
 */
export function handleApiError(
  error: unknown,
  context?: { route?: string; userId?: string; requestData?: unknown }
): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors (don't report to Sentry - client error)
  if (error instanceof z.ZodError) {
    return apiValidationError(error)
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    // Only report server errors (5xx) to Sentry
    if (error.statusCode >= 500) {
      reportToSentry(error, error.statusCode, context)
    }
    return apiError(error.message, error.statusCode, error.details)
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown }

    switch (prismaError.code) {
      case 'P2002':
        // Duplicate record - client error, don't report
        return apiError(
          'A record with this information already exists',
          HTTP_STATUS.CONFLICT,
          prismaError.meta
        )
      case 'P2025':
        // Record not found - client error, don't report
        return apiError(
          'Record not found',
          HTTP_STATUS.NOT_FOUND,
          prismaError.meta
        )
      case 'P2003':
        // Invalid reference - client error, don't report
        return apiError(
          'Invalid reference to related record',
          HTTP_STATUS.BAD_REQUEST,
          prismaError.meta
        )
      default:
        // Other database errors - report to Sentry
        reportToSentry(
          new Error(`Database error: ${prismaError.code}`),
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          { ...context, prismaError }
        )
        return apiError(
          'Database operation failed',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          prismaError
        )
    }
  }

  // Handle generic errors - report to Sentry
  if (error instanceof Error) {
    reportToSentry(error, HTTP_STATUS.INTERNAL_SERVER_ERROR, context)
    return apiError(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }

  // Unknown error type - report to Sentry
  const unknownError = new Error('An unexpected error occurred')
  reportToSentry(unknownError, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
    ...context,
    originalError: String(error),
  })
  return apiError(
    'An unexpected error occurred',
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  )
}

/**
 * Reports an error to Sentry with context
 */
function reportToSentry(
  error: Error,
  statusCode: number,
  context?: { route?: string; userId?: string; requestData?: unknown; [key: string]: unknown }
): void {
  Sentry.captureException(error, {
    contexts: {
      api: {
        route: context?.route,
        statusCode,
      },
      request: context?.requestData ? {
        body: sanitizeData(context.requestData),
      } : undefined,
    },
    tags: {
      errorType: 'api',
      statusCode: String(statusCode),
      route: context?.route || 'unknown',
    },
    user: context?.userId ? { id: context.userId } : undefined,
    level: statusCode >= 500 ? 'error' : 'warning',
  })

  // Add breadcrumb for debugging
  Sentry.addBreadcrumb({
    category: 'api',
    message: `API Error: ${error.message}`,
    level: 'error',
    data: {
      statusCode,
      route: context?.route,
    },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets a user-friendly error name based on status code
 */
function getErrorName(status: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  }

  return errorNames[status] || 'Error'
}

/**
 * Validates request body with Zod schema
 * Throws ValidationError if invalid
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data', formatZodErrors(error))
    }
    throw error
  }
}

/**
 * Parses and validates JSON request body
 * @param request - Next.js request object
 * @param schema - Optional Zod schema for validation
 * @returns Parsed (and validated) request body
 */
export async function parseRequestBody<T>(
  request: Request,
  schema?: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()

    if (schema) {
      return await validateRequest(schema, body)
    }

    return body as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body')
    }
    throw error
  }
}

/**
 * Validates URL parameters with Zod schema
 * @param params - URL parameters object
 * @param schema - Zod schema
 * @returns Validated parameters
 */
export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid URL parameters', formatZodErrors(error))
    }
    throw error
  }
}
