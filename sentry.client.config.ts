/**
 * Sentry Client-side Configuration
 * This file configures the Sentry SDK for the browser (client-side)
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

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

    // Session Replay
    // This sets the sample rate to be 10%. You may want this to be 100% while in development
    // and sample at a lower rate in production.
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Set profilesSampleRate to 1.0 to profile every transaction
    // Since profilesSampleRate is relative to tracesSampleRate,
    // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Disable in development to reduce noise, or enable for testing
    enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',

    // Release tracking (set during build)
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // Debug mode for development
    debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',

    // Breadcrumb configuration
    maxBreadcrumbs: 50,

    // Before send hook - allows filtering/modifying events
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      const error = hint.originalException as Error | undefined

      // Don't report user-triggered navigation cancellations
      if (error?.message?.includes('Abort')) {
        return null
      }

      // Add additional context
      if (event.contexts) {
        event.contexts.app = {
          ...event.contexts.app,
          platform: 'VivanceData Learning Platform',
        }
      }

      return event
    },

    // Configure integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask all text content for privacy
        maskAllText: false,
        // Block all media elements
        blockAllMedia: false,
      }),
      Sentry.browserTracingIntegration({
        // Trace interactions for performance monitoring
        enableInp: true,
      }),
      Sentry.feedbackIntegration({
        // Show the feedback button
        colorScheme: 'system',
        showBranding: false,
        triggerLabel: 'Report an Issue',
        formTitle: 'Report an Issue',
        submitButtonLabel: 'Send Report',
        successMessageText: 'Thank you for your feedback!',
      }),
    ],

    // Ignore common benign errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Safari handling
      'webkit',
      // Chrome specific
      'ResizeObserver loop',
      // Network errors that are expected
      'Failed to fetch',
      'NetworkError',
      // User navigation
      'AbortError',
      // Loading chunk failed (usually network issues)
      /Loading chunk \d+ failed/,
    ],

    // Deny URLs from known browser extensions and bots
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Firefox extensions
      /^resource:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
    ],
  })
}
