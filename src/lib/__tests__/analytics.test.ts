import { analytics, ANALYTICS_EVENTS } from '../analytics'
import { setAnalyticsConsent } from '../analytics-consent'
import { getPostHog } from '../posthog-client'

jest.mock('../posthog-client', () => ({ getPostHog: jest.fn() }))

const mockGetPostHog = getPostHog as jest.Mock

function fakePostHog() {
  return {
    __loaded: true,
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    alias: jest.fn(),
    register: jest.fn(),
    opt_out_capturing: jest.fn(),
    opt_in_capturing: jest.fn(),
    has_opted_out_capturing: jest.fn(() => true),
    people: { set: jest.fn(), set_once: jest.fn() },
  }
}

type FakePostHog = ReturnType<typeof fakePostHog>

// Each public call, and the PostHog method it must reach.
const calls: Array<[string, () => unknown, (ph: FakePostHog) => jest.Mock]> = [
  ['track', () => analytics.track('custom_event', { a: 1 }), (ph) => ph.capture],
  ['identify', () => analytics.identify('u1', { email: 'a@example.com' }), (ph) => ph.identify],
  ['page', () => analytics.page('Home'), (ph) => ph.capture],
  ['reset', () => analytics.reset(), (ph) => ph.reset],
  ['setUserProperties', () => analytics.setUserProperties({ plan: 'free' }), (ph) => ph.people.set],
  ['incrementUserProperty', () => analytics.incrementUserProperty('lessons'), (ph) => ph.people.set_once],
  ['alias', () => analytics.alias('u2'), (ph) => ph.alias],
  ['registerSuperProperties', () => analytics.registerSuperProperties({ app: 'learn' }), (ph) => ph.register],
  ['optOut', () => analytics.optOut(), (ph) => ph.opt_out_capturing],
  ['optIn', () => analytics.optIn(), (ph) => ph.opt_in_capturing],
  ['hasOptedOut', () => analytics.hasOptedOut(), (ph) => ph.has_opted_out_capturing],
]

const typedEvents: Array<[string, () => void]> = [
  [ANALYTICS_EVENTS.USER_SIGNED_UP, () => analytics.trackUserSignedUp({ plan_type: 'free' })],
  [ANALYTICS_EVENTS.USER_SIGNED_IN, () => analytics.trackUserSignedIn({ signin_method: 'email' })],
  [ANALYTICS_EVENTS.USER_SIGNED_OUT, () => analytics.trackUserSignedOut()],
  [ANALYTICS_EVENTS.COURSE_STARTED, () => analytics.trackCourseStarted({} as never)],
  [ANALYTICS_EVENTS.LESSON_COMPLETED, () => analytics.trackLessonCompleted({} as never)],
  [ANALYTICS_EVENTS.QUIZ_COMPLETED, () => analytics.trackQuizCompleted({} as never)],
  [ANALYTICS_EVENTS.ASSESSMENT_COMPLETED, () => analytics.trackAssessmentCompleted({} as never)],
  [ANALYTICS_EVENTS.PROJECT_SUBMITTED, () => analytics.trackProjectSubmitted({} as never)],
  [ANALYTICS_EVENTS.STREAK_ACHIEVED, () => analytics.trackStreakAchieved({} as never)],
  [ANALYTICS_EVENTS.LEVEL_UP, () => analytics.trackLevelUp({} as never)],
  [ANALYTICS_EVENTS.ACHIEVEMENT_UNLOCKED, () => analytics.trackAchievementUnlocked({} as never)],
  [ANALYTICS_EVENTS.SUBSCRIPTION_STARTED, () => analytics.trackSubscriptionStarted({} as never)],
  [ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED, () => analytics.trackSubscriptionCancelled({} as never)],
  [ANALYTICS_EVENTS.COURSE_ENROLLED, () => analytics.trackCourseEnrolled({} as never)],
  [ANALYTICS_EVENTS.SEARCH_PERFORMED, () => analytics.trackSearchPerformed({} as never)],
  [ANALYTICS_EVENTS.DISCUSSION_CREATED, () => analytics.trackDiscussionCreated({} as never)],
  [ANALYTICS_EVENTS.REPLY_CREATED, () => analytics.trackReplyCreated({} as never)],
  [ANALYTICS_EVENTS.ERROR_OCCURRED, () => analytics.trackError('auth_error', 'nope')],
]

describe('analytics helper', () => {
  const originalKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const env = process.env as Record<string, string | undefined>
  const originalNodeEnv = env.NODE_ENV
  let posthog: FakePostHog

  beforeEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
    window.localStorage.clear()
    setAnalyticsConsent('granted')
    posthog = fakePostHog()
    mockGetPostHog.mockReturnValue(posthog)
  })

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv
    jest.restoreAllMocks()
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalKey
  })

  it.each(calls)('%s reaches PostHog with consent and a loaded client', (_name, call, target) => {
    call()
    expect(target(posthog)).toHaveBeenCalled()
  })

  it('reports the opt-out state from PostHog', () => {
    expect(analytics.hasOptedOut()).toBe(true)
  })

  it.each(typedEvents)('captures %s through the typed helper', (event, call) => {
    call()
    expect(posthog.capture).toHaveBeenCalledWith(event, expect.objectContaining({ timestamp: expect.any(String) }))
  })

  describe('sends nothing', () => {
    it.each(calls)('%s without consent', (_name, call, target) => {
      setAnalyticsConsent('denied')
      call()
      expect(target(posthog)).not.toHaveBeenCalled()
    })

    it.each(calls)('%s before PostHog has loaded', (_name, call, target) => {
      mockGetPostHog.mockReturnValue(null)
      call()
      expect(target(posthog)).not.toHaveBeenCalled()
    })

    it('when no PostHog key is configured', () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY
      analytics.track('custom_event')
      expect(posthog.capture).not.toHaveBeenCalled()
      expect(analytics.hasOptedOut()).toBe(false)
    })

    it('while the client is still initialising', () => {
      posthog.__loaded = false
      analytics.track('custom_event')
      expect(posthog.capture).not.toHaveBeenCalled()
    })
  })

  describe('a failing PostHog call never throws', () => {
    function failEverything() {
      for (const fn of calls.map(([, , target]) => target(posthog))) {
        fn.mockImplementation(() => {
          throw new Error('posthog down')
        })
      }
    }

    it.each(calls)('%s swallows the error', (_name, call) => {
      failEverything()
      expect(() => call()).not.toThrow()
    })

    it.each(calls.filter(([name]) => name !== 'hasOptedOut'))(
      '%s warns about it in development',
      (_name, call) => {
        failEverything()
        env.NODE_ENV = 'development'
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
        call()
        expect(warn).toHaveBeenCalled()
      }
    )

    it('hasOptedOut answers false when PostHog throws', () => {
      failEverything()
      expect(analytics.hasOptedOut()).toBe(false)
    })
  })
})
