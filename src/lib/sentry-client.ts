import type * as SentryModule from '@sentry/nextjs'

type Sentry = typeof SentryModule

/**
 * The browser Sentry SDK (~190 KB gzipped with Replay) is not part of any
 * page's first load. sentry.client.config.ts starts it when the browser is
 * first idle; error boundaries call loadSentry() themselves, so an error that
 * reaches one is still reported even if it happens before that. Errors that
 * reach no boundary before the SDK starts are not reported.
 */
let loading: Promise<Sentry | null> | null = null
const pending: Array<(sentry: Sentry) => void> = []

function isConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) && typeof window !== 'undefined'
}

export function loadSentry(): Promise<Sentry | null> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn || !isConfigured()) {
    return Promise.resolve(null)
  }

  loading ??= import('@sentry/nextjs').then((Sentry) => {
    Sentry.init(sentryOptions(Sentry, dsn))
    for (const fn of pending.splice(0)) fn(Sentry)
    return Sentry
  })
  return loading
}

/**
 * Starts the SDK now if it is not running yet, then runs fn. For reporting
 * errors; a no-op when Sentry is not configured.
 */
export function withSentry(fn: (sentry: Sentry) => void): void {
  void loadSentry().then((sentry) => {
    if (sentry) fn(sentry)
  })
}

/**
 * Runs fn once the SDK has started, without starting it early. For context
 * such as the signed-in user and breadcrumbs.
 */
export function onSentryReady(fn: (sentry: Sentry) => void): void {
  if (!isConfigured()) return
  if (loading) {
    void loading.then((sentry) => {
      if (sentry) fn(sentry)
    })
    return
  }
  pending.push(fn)
}

function sentryOptions(Sentry: Sentry, dsn: string): Parameters<Sentry['init']>[0] {
  return {
    dsn,

    // Environment configuration
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, consider lowering this to 0.1 (10%) to reduce costs
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay: no ambient session sampling. A replay is kept only when
    // an error occurs, with all text and inputs masked and media blocked.
    // The privacy policy (/privacy) describes exactly this; changing these
    // values needs a policy update and, for ambient replays, consent.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

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
        // Mask all text and inputs, block images and video
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
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
  }
}
