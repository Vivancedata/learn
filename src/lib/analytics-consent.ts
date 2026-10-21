/**
 * Browser-side analytics consent.
 *
 * PostHog is not loaded until the visitor chooses "Allow" in the consent
 * banner. The choice lives in localStorage on this device only; the privacy
 * page offers a way to change it. Server-side events are covered separately
 * in the privacy policy.
 */

export type AnalyticsConsent = 'granted' | 'denied'

export const ANALYTICS_CONSENT_KEY = 'vd-analytics-consent'
export const ANALYTICS_CONSENT_EVENT = 'vd-analytics-consent-change'

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    // Storage blocked (private mode, site data disabled): treat as no answer.
    return null
  }
}

/** Store a choice, or pass null to forget it and ask again. */
export function setAnalyticsConsent(consent: AnalyticsConsent | null): void {
  if (typeof window === 'undefined') return
  try {
    if (consent === null) {
      window.localStorage.removeItem(ANALYTICS_CONSENT_KEY)
    } else {
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent)
    }
  } catch {
    // Without storage the choice lasts for this page view only.
  }
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: consent }))
}

/** useSyncExternalStore subscriber: this tab's changes and other tabs'. */
export function subscribeToAnalyticsConsent(onChange: () => void): () => void {
  window.addEventListener(ANALYTICS_CONSENT_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}
