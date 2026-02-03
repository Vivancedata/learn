/**
 * Sentry Server-side Configuration
 * This file configures the Sentry SDK for Node.js (server-side)
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, consider lowering this to 0.1 (10%) to reduce costs
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set profilesSampleRate to 1.0 to profile every transaction
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Disable in development to reduce noise, or enable for testing
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG === 'true',

    // Release tracking (set during build)
    release: process.env.SENTRY_RELEASE,

    // Debug mode for development
    debug: process.env.SENTRY_DEBUG === 'true',

    // Breadcrumb configuration
    maxBreadcrumbs: 50,

    // Before send hook - allows filtering/modifying events
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      const error = hint.originalException as Error | undefined

      // Add server-side context
      if (event.contexts) {
        event.contexts.runtime = {
          name: 'node',
          version: process.version,
        }
        event.contexts.app = {
          ...event.contexts.app,
          platform: 'VivanceData Learning Platform',
          component: 'server',
        }
      }

      // Scrub sensitive data from request bodies
      if (event.request?.data) {
        const data = typeof event.request.data === 'string'
          ? JSON.parse(event.request.data)
          : event.request.data

        // Remove sensitive fields
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']
        for (const field of sensitiveFields) {
          if (data[field]) {
            data[field] = '[REDACTED]'
          }
        }

        event.request.data = JSON.stringify(data)
      }

      return event
    },

    // Ignore common server-side errors
    ignoreErrors: [
      // Expected authentication errors
      'Unauthorized access',
      // Rate limiting
      'Too many requests',
      // Client disconnections
      'ECONNRESET',
      'EPIPE',
    ],

    // Configure integrations
    integrations: [
      // Prisma integration for database tracing
      Sentry.prismaIntegration(),
    ],
  })
}
