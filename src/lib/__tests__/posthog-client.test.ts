import type { PostHog } from 'posthog-js'

const mockPosthog = {
  __loaded: false,
  init: jest.fn(() => {
    mockPosthog.__loaded = true
  }),
}

jest.mock('posthog-js', () => ({ __esModule: true, default: mockPosthog }))

async function freshModules() {
  jest.resetModules()
  return {
    client: await import('../posthog-client'),
    consent: await import('../analytics-consent'),
    analytics: await import('../analytics'),
  }
}

describe('posthog-client', () => {
  const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    window.localStorage.clear()
    mockPosthog.__loaded = false
    mockPosthog.init.mockClear()
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey
  })

  it('initialises PostHog once consent is granted', async () => {
    const { client, consent } = await freshModules()
    consent.setAnalyticsConsent('granted')

    const posthog = await client.loadPostHog()

    expect(posthog).toBe(mockPosthog)
    expect(mockPosthog.init).toHaveBeenCalledTimes(1)
    expect(client.getPostHog()).toBe(mockPosthog)
  })

  it('never initialises when consent is withdrawn while the library loads', async () => {
    const { client, consent } = await freshModules()
    consent.setAnalyticsConsent('granted')

    const pending = client.loadPostHog()
    consent.setAnalyticsConsent('denied')

    expect(await pending).toBeNull()
    expect(mockPosthog.init).not.toHaveBeenCalled()
    expect(client.getPostHog()).toBeNull()
  })

  it('sends nothing through the analytics helper without consent, even if loaded', async () => {
    const { client, consent, analytics } = await freshModules()
    consent.setAnalyticsConsent('granted')
    const posthog = (await client.loadPostHog()) as unknown as PostHog & { capture?: jest.Mock }
    posthog.capture = jest.fn()

    consent.setAnalyticsConsent('denied')
    analytics.analytics.track('lesson_completed')

    expect(posthog.capture).not.toHaveBeenCalled()
  })
})
