'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * PostHog configuration
 * Initialize PostHog with the API key and host from environment variables
 */
function initPostHog(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  // Only initialize if we have the required config
  if (!apiKey || typeof window === 'undefined') {
    return false
  }

  // Check if already initialized
  if (posthog.__loaded) {
    return true
  }

  posthog.init(apiKey, {
    api_host: apiHost || 'https://app.posthog.com',
    // Enable automatic pageview tracking
    capture_pageview: false, // We'll handle this manually for more control
    capture_pageleave: true,
    // Persistence settings
    persistence: 'localStorage+cookie',
    // Session recording (optional - can be enabled in PostHog dashboard)
    disable_session_recording: false,
    // Autocapture settings
    autocapture: true,
    // Privacy settings
    respect_dnt: true, // Respect Do Not Track browser setting
    // Advanced settings
    loaded: (posthog) => {
      // Debug mode in development
      if (process.env.NODE_ENV === 'development') {
        posthog.debug()
      }
    },
    // Bootstrap with feature flags if available
    bootstrap: {
      distinctID: undefined, // Will be set when user logs in
    },
  })

  return true
}

/**
 * Page view tracker component
 * Tracks page views with relevant context
 */
function PostHogPageView(): null {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthogClient = usePostHog()
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    if (!posthogClient || !pathname) return

    // Avoid duplicate page views
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname

    // Build URL with search params
    let url = window.origin + pathname
    if (searchParams && searchParams.toString()) {
      url = url + '?' + searchParams.toString()
    }

    // Extract context from pathname
    const pageProperties: Record<string, string | undefined> = {
      path: pathname,
      url,
      referrer: document.referrer || undefined,
    }

    // Add context for specific page types
    const courseMatch = pathname.match(/^\/courses\/([^/]+)/)
    const lessonMatch = pathname.match(/^\/courses\/([^/]+)\/([^/]+)/)
    const pathMatch = pathname.match(/^\/paths\/([^/]+)/)

    if (lessonMatch) {
      pageProperties.course_id = lessonMatch[1]
      pageProperties.lesson_id = lessonMatch[2]
      pageProperties.page_type = 'lesson'
    } else if (courseMatch) {
      pageProperties.course_id = courseMatch[1]
      pageProperties.page_type = 'course'
    } else if (pathMatch) {
      pageProperties.path_id = pathMatch[1]
      pageProperties.page_type = 'learning_path'
    } else if (pathname === '/dashboard') {
      pageProperties.page_type = 'dashboard'
    } else if (pathname === '/sign-in' || pathname.startsWith('/sign-in')) {
      pageProperties.page_type = 'sign_in'
    } else if (pathname === '/sign-up' || pathname.startsWith('/sign-up')) {
      pageProperties.page_type = 'sign_up'
    } else if (pathname === '/') {
      pageProperties.page_type = 'home'
    } else {
      pageProperties.page_type = 'other'
    }

    // Track page view
    posthogClient.capture('$pageview', pageProperties)
  }, [pathname, searchParams, posthogClient])

  return null
}

/**
 * PostHog Provider Props
 */
interface PostHogProviderProps {
  children: React.ReactNode
}

/**
 * PostHog Provider Component
 * Wraps the application with PostHog analytics tracking
 *
 * Features:
 * - Automatic page view tracking with context
 * - Feature flag support
 * - User identification
 * - Event tracking
 *
 * Analytics is non-blocking - tracking failures won't affect user experience
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initPostHog()
      initialized.current = true
    }
  }, [])

  // If PostHog key is not configured, render children without provider
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  )
}

/**
 * Export the PostHog instance for direct access if needed
 */
export { posthog }
