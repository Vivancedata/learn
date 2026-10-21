import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from '@/lib/analytics-consent'
import { isProTierEnabled } from '@/lib/pro-tier'

describe('analytics consent', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('is unanswered until the visitor chooses', () => {
    expect(getAnalyticsConsent()).toBeNull()
  })

  it('stores and reads back a choice', () => {
    setAnalyticsConsent('granted')
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('granted')
    expect(getAnalyticsConsent()).toBe('granted')

    setAnalyticsConsent('denied')
    expect(getAnalyticsConsent()).toBe('denied')
  })

  it('forgets the choice when passed null', () => {
    setAnalyticsConsent('granted')
    setAnalyticsConsent(null)
    expect(getAnalyticsConsent()).toBeNull()
  })

  it('ignores unexpected stored values', () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'yes')
    expect(getAnalyticsConsent()).toBeNull()
  })

  it('treats blocked storage as no answer and still notifies listeners', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const listener = jest.fn()
    window.addEventListener(ANALYTICS_CONSENT_EVENT, listener)

    expect(getAnalyticsConsent()).toBeNull()
    expect(() => setAnalyticsConsent('granted')).not.toThrow()
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(ANALYTICS_CONSENT_EVENT, listener)
    getItem.mockRestore()
    setItem.mockRestore()
  })

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const onChange = jest.fn()
    const unsubscribe = subscribeToAnalyticsConsent(onChange)

    setAnalyticsConsent('granted')
    window.dispatchEvent(new StorageEvent('storage', { key: ANALYTICS_CONSENT_KEY }))
    expect(onChange).toHaveBeenCalledTimes(2)

    unsubscribe()
    setAnalyticsConsent('denied')
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})

describe('isProTierEnabled', () => {
  const original = process.env.NEXT_PUBLIC_PRO_TIER_ENABLED

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_PRO_TIER_ENABLED
    else process.env.NEXT_PUBLIC_PRO_TIER_ENABLED = original
  })

  it('is off by default', () => {
    delete process.env.NEXT_PUBLIC_PRO_TIER_ENABLED
    expect(isProTierEnabled()).toBe(false)
  })

  it('is on only for the exact string "true"', () => {
    process.env.NEXT_PUBLIC_PRO_TIER_ENABLED = 'true'
    expect(isProTierEnabled()).toBe(true)
    process.env.NEXT_PUBLIC_PRO_TIER_ENABLED = 'TRUE'
    expect(isProTierEnabled()).toBe(false)
  })
})
