'use client'

import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from '@/lib/analytics-consent'

/** Lets a visitor see and change their browser analytics choice. */
export function AnalyticsConsentControl() {
  // undefined on the server; null once mounted means "not asked yet".
  const consent = useSyncExternalStore(subscribeToAnalyticsConsent, getAnalyticsConsent, () => undefined)

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || consent === undefined) return null

  const label =
    consent === 'granted'
      ? 'You have allowed analytics in this browser.'
      : consent === 'denied'
        ? 'You have refused analytics in this browser.'
        : 'You have not chosen yet.'

  return (
    <div className="not-prose my-6 rounded-lg border border-border p-4">
      <p className="text-sm" role="status">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={consent === 'granted' ? 'default' : 'outline'}
          onClick={() => setAnalyticsConsent('granted')}
        >
          Allow analytics
        </Button>
        <Button
          size="sm"
          variant={consent === 'denied' ? 'default' : 'outline'}
          onClick={() => setAnalyticsConsent('denied')}
        >
          Refuse analytics
        </Button>
      </div>
    </div>
  )
}
