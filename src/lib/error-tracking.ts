/**
 * Error Tracking Utilities
 * Provides helper functions for tracking errors, messages, and breadcrumbs with Sentry
 */

import * as Sentry from '@sentry/nextjs'

// ============================================================================
// Types
// ============================================================================

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug'
export type BreadcrumbCategory =
  | 'auth'
  | 'api'
  | 'navigation'
  | 'ui'
  | 'payment'
  | 'database'
  | 'user-action'
  | 'state'
  | 'console'

export interface ErrorContext {
  /** User ID if available */
  userId?: string
  /** Page or route where the error occurred */
  route?: string
  /** Additional context data */
  [key: string]: unknown
}

export interface ApiErrorContext extends ErrorContext {
  /** API endpoint */
  endpoint?: string
  /** HTTP method */
  method?: string
  /** Request body (sanitized) */
  requestBody?: unknown
  /** Response status code */
  statusCode?: number
  /** Response body */
  responseBody?: unknown
}

export interface PaymentErrorContext extends ErrorContext {
  /** Payment amount */
  amount?: number
  /** Currency */
  currency?: string
  /** Payment provider */
  provider?: string
  /** Transaction ID */
  transactionId?: string
}

// ============================================================================
// Error Tracking
// ============================================================================

/**
 * Capture an exception with additional context
 * @param error - The error to capture
 * @param context - Additional context information
 * @returns The Sentry event ID
 */
export function trackError(
  error: Error | unknown,
  context?: ErrorContext
): string {
  const eventId = Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
    tags: buildTags(context),
  })

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Tracked]', error, context)
  }

  return eventId
}

/**
 * Track an API error with request/response context
 * @param error - The error to capture
 * @param context - API-specific context
 * @returns The Sentry event ID
 */
export function trackApiError(
  error: Error | unknown,
  context: ApiErrorContext
): string {
  const eventId = Sentry.captureException(error, {
    contexts: {
      api: {
        endpoint: context.endpoint,
        method: context.method,
        statusCode: context.statusCode,
      },
      request: {
        body: sanitizeData(context.requestBody),
      },
      response: {
        body: context.responseBody,
      },
    },
    tags: {
      ...buildTags(context),
      errorType: 'api',
      endpoint: context.endpoint,
      method: context.method,
      statusCode: String(context.statusCode),
    },
    level: context.statusCode && context.statusCode >= 500 ? 'error' : 'warning',
  })

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error Tracked]', error, context)
  }

  return eventId
}

/**
 * Track a payment error
 * @param error - The error to capture
 * @param context - Payment-specific context
 * @returns The Sentry event ID
 */
export function trackPaymentError(
  error: Error | unknown,
  context: PaymentErrorContext
): string {
  const eventId = Sentry.captureException(error, {
    contexts: {
      payment: {
        amount: context.amount,
        currency: context.currency,
        provider: context.provider,
        transactionId: context.transactionId,
      },
    },
    tags: {
      ...buildTags(context),
      errorType: 'payment',
      provider: context.provider,
    },
    level: 'error',
    fingerprint: ['payment-error', context.provider || 'unknown'],
  })

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Payment Error Tracked]', error, context)
  }

  return eventId
}

/**
 * Track a database error
 * @param error - The error to capture
 * @param operation - The database operation that failed
 * @param model - The Prisma model involved
 * @param context - Additional context
 * @returns The Sentry event ID
 */
export function trackDatabaseError(
  error: Error | unknown,
  operation: string,
  model: string,
  context?: ErrorContext
): string {
  const eventId = Sentry.captureException(error, {
    contexts: {
      database: {
        operation,
        model,
      },
      custom: context,
    },
    tags: {
      ...buildTags(context),
      errorType: 'database',
      operation,
      model,
    },
    level: 'error',
    fingerprint: ['database-error', operation, model],
  })

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Database Error Tracked]', error, { operation, model, context })
  }

  return eventId
}

// ============================================================================
// Message Tracking
// ============================================================================

/**
 * Capture a message (non-exception event)
 * @param message - The message to capture
 * @param level - Severity level
 * @param context - Additional context
 * @returns The Sentry event ID
 */
export function trackMessage(
  message: string,
  level: ErrorSeverity = 'info',
  context?: ErrorContext
): string {
  const eventId = Sentry.captureMessage(message, {
    level: level as Sentry.SeverityLevel,
    contexts: {
      custom: context,
    },
    tags: buildTags(context),
  })

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Message Tracked - ${level}]`, message, context)
  }

  return eventId
}

// ============================================================================
// Breadcrumbs
// ============================================================================

/**
 * Add a breadcrumb for debugging
 * @param message - Breadcrumb message
 * @param category - Category for grouping breadcrumbs
 * @param data - Additional data
 * @param level - Severity level
 */
export function addBreadcrumb(
  message: string,
  category: BreadcrumbCategory,
  data?: Record<string, unknown>,
  level: ErrorSeverity = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level: level as Sentry.SeverityLevel,
    data: sanitizeData(data),
    timestamp: Date.now() / 1000,
  })

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Breadcrumb - ${category}]`, message, data)
  }
}

/**
 * Add a navigation breadcrumb
 * @param from - Previous route
 * @param to - New route
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
  addBreadcrumb(`Navigated from ${from} to ${to}`, 'navigation', { from, to })
}

/**
 * Add a user action breadcrumb
 * @param action - Description of the action
 * @param data - Additional data about the action
 */
export function addUserActionBreadcrumb(
  action: string,
  data?: Record<string, unknown>
): void {
  addBreadcrumb(action, 'user-action', data)
}

/**
 * Add an API request breadcrumb
 * @param method - HTTP method
 * @param url - Request URL
 * @param statusCode - Response status code
 * @param duration - Request duration in ms
 */
export function addApiRequestBreadcrumb(
  method: string,
  url: string,
  statusCode?: number,
  duration?: number
): void {
  addBreadcrumb(`${method} ${url}`, 'api', {
    method,
    url,
    statusCode,
    duration,
  })
}

// ============================================================================
// Context Management
// ============================================================================

/**
 * Set user context for error tracking
 * @param user - User information
 */
export function setUser(user: { id: string; email?: string; name?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Set a tag for all subsequent events
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value)
}

/**
 * Set extra context data
 * @param key - Context key
 * @param value - Context value
 */
export function setExtra(key: string, value: unknown): void {
  Sentry.setExtra(key, value)
}

/**
 * Run a function within a Sentry transaction for performance monitoring
 * @param name - Transaction name
 * @param operation - Operation type
 * @param fn - Function to execute
 * @returns Result of the function
 */
export async function withTransaction<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    async () => {
      return await fn()
    }
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build tags object from context
 */
function buildTags(context?: ErrorContext): Record<string, string> {
  const tags: Record<string, string> = {}

  if (context?.userId) {
    tags.userId = context.userId
  }

  if (context?.route) {
    tags.route = context.route
  }

  return tags
}

/**
 * Sanitize data to remove sensitive information
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
// Utility Functions
// ============================================================================

/**
 * Check if Sentry is configured and enabled
 */
export function isSentryEnabled(): boolean {
  return !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
}

/**
 * Flush pending events (useful before process exit)
 * @param timeout - Maximum time to wait in ms
 */
export async function flush(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout)
}

/**
 * Close the Sentry client
 * @param timeout - Maximum time to wait in ms
 */
export async function close(timeout = 2000): Promise<boolean> {
  return Sentry.close(timeout)
}
