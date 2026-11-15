'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import type { PostHog } from 'posthog-js'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/analytics-consent'
import { getPostHog, loadPostHog } from '@/lib/posthog-client'

/**
 * Page view tracker component
 * Tracks page views with relevant context
 */
const COURSE_PATH = /^\/courses\/([^/]+)/
const LESSON_PATH = /^\/courses\/([^/]+)\/([^/]+)/
const LEARNING_PATH = /^\/paths\/([^/]+)/

function PostHogPageView({ posthogClient }: { posthogClient: PostHog }): null {
  const pathname = usePathname()
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return

    // Avoid duplicate page views
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname

    // The query string is read here, when the view is recorded, rather than
    // through useSearchParams(). That hook subscribed this component (mounted
    // in the root layout) to every query change and, on statically rendered
    // routes, opted everything under the layout's Suspense boundary out of
    // server rendering whenever PostHog was configured.
    const url = window.origin + pathname + window.location.search

    // Extract context from pathname
    const pageProperties: Record<string, string | undefined> = {
      path: pathname,
      url,
      referrer: document.referrer || undefined,
    }

    // Add context for specific page types
    const courseMatch = pathname.match(COURSE_PATH)
    const lessonMatch = pathname.match(LESSON_PATH)
    const pathMatch = pathname.match(LEARNING_PATH)

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
  }, [pathname, posthogClient])

  return null
}

/**
 * Asks once whether PostHog may run in this browser. Nothing analytics-related
 * loads until the visitor answers "Allow".
 */
function ConsentBanner({ onChoice }: { onChoice: (consent: AnalyticsConsent) => void }) {
  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed inset-x-4 bottom-20 z-60 mx-auto max-w-xl rounded-lg border border-border bg-background p-4 shadow-lg md:bottom-4"
    >
      <p className="text-sm text-muted-foreground">
        May we use PostHog analytics to see which pages and lessons get used?
        It sets a cookie and records page views and clicks, not what you type,
        and never a recording of your session.{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => onChoice('granted')}>
          Allow
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChoice('denied')}>
          No thanks
        </Button>
      </div>
    </div>
  )
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
 * - PostHog is initialised only after the visitor allows analytics; the
 *   choice is stored in localStorage (src/lib/analytics-consent.ts).
 * - Page views and autocapture run only with consent; session recording is
 *   always off.
 * - Withdrawing consent (privacy page) opts PostHog out and clears its
 *   storage.
 *
 * Analytics is non-blocking - tracking failures won't affect user experience
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  const enabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
  // undefined during server render and hydration; null = no answer given.
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    () => undefined
  )
  // The client is set only once posthog-js has been loaded and initialised,
  // so the page-view tracker never mounts ahead of init.
  const [client, setClient] = useState<PostHog | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (consent === 'granted') {
      let cancelled = false
      void loadPostHog().then((posthog) => {
        if (!posthog) return
        if (getAnalyticsConsent() !== 'granted') {
          posthog.opt_out_capturing()
          posthog.reset()
          return
        }
        if (cancelled) return
        if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing()
        setClient(posthog)
      })
      return () => {
        cancelled = true
      }
    }
    // Consent withdrawn after PostHog had loaded in this page view.
    const posthog = getPostHog()
    if (posthog?.__loaded) {
      posthog.opt_out_capturing()
      posthog.reset()
    }
    setClient(null)
  }, [enabled, consent])

  return (
    <>
      {consent === 'granted' && client && <PostHogPageView posthogClient={client} />}
      {children}
      {enabled && consent === null && <ConsentBanner onChoice={setAnalyticsConsent} />}
    </>
  )
}
