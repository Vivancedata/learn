import type { PostHog } from 'posthog-js'

/**
 * posthog-js is ~120 KB gzipped and does nothing until the visitor allows
 * analytics, so it is downloaded on consent instead of riding every page's
 * initial bundle. Before that, getPostHog() is null and analytics is a no-op.
 */
let client: PostHog | null = null
let loading: Promise<PostHog | null> | null = null

export function getPostHog(): PostHog | null {
  return client
}

export function loadPostHog(): Promise<PostHog | null> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey || typeof window === 'undefined') {
    return Promise.resolve(null)
  }

  loading ??= import('posthog-js').then(({ default: posthog }) => {
    if (!posthog.__loaded) {
      posthog.init(apiKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        // Page views are captured by PostHogProvider with page context.
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
        // Session recording stays off even with consent: the privacy policy
        // says sessions are not recorded. Turning this on needs a policy update.
        disable_session_recording: true,
        // Clicks and form interactions (never input values), only after consent
        autocapture: true,
        respect_dnt: true,
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') {
            ph.debug()
          }
        },
      })
    }
    client = posthog
    return posthog
  })

  return loading
}
