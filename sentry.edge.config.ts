/**
 * Sentry Edge Runtime Configuration
 * This file configures the Sentry SDK for Edge Runtime (middleware, edge functions)
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

    // Disable in development to reduce noise, or enable for testing
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG === 'true',

    // Release tracking (set during build)
    release: process.env.SENTRY_RELEASE,

    // Debug mode for development
    debug: process.env.SENTRY_DEBUG === 'true',

    // Breadcrumb configuration
    maxBreadcrumbs: 30,

    // Before send hook - allows filtering/modifying events
    beforeSend(event, hint) {
      // Add edge runtime context
      if (event.contexts) {
        event.contexts.runtime = {
          name: 'edge',
        }
        event.contexts.app = {
          ...event.contexts.app,
          platform: 'VivanceData Learning Platform',
          component: 'edge',
        }
      }

      return event
    },

    // Ignore common edge runtime errors
    ignoreErrors: [
      // Rate limiting handled at middleware
      'Too many requests',
      // Authentication redirects
      'Unauthorized',
    ],
  })
}
