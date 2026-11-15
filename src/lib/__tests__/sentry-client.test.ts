const mockSentry = {
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(() => 'event-1'),
  replayIntegration: jest.fn(),
  browserTracingIntegration: jest.fn(),
  feedbackIntegration: jest.fn(),
}

jest.mock('@sentry/nextjs', () => mockSentry)

async function freshClient() {
  jest.resetModules()
  return import('../sentry-client')
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('sentry-client', () => {
  const originalDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o0.ingest.sentry.io/0'
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn
  })

  it('holds context until the SDK starts, without starting it', async () => {
    const client = await freshClient()

    client.onSentryReady((Sentry) => Sentry.setUser({ id: 'u1' }))
    await flush()
    expect(mockSentry.init).not.toHaveBeenCalled()
    expect(mockSentry.setUser).not.toHaveBeenCalled()

    await client.loadSentry()
    expect(mockSentry.init).toHaveBeenCalledTimes(1)
    expect(mockSentry.setUser).toHaveBeenCalledWith({ id: 'u1' })
  })

  it('starts the SDK at once to report an error, and only once', async () => {
    const client = await freshClient()

    client.withSentry((Sentry) => Sentry.captureException(new Error('boom')))
    client.withSentry((Sentry) => Sentry.captureException(new Error('again')))
    await flush()

    expect(mockSentry.init).toHaveBeenCalledTimes(1)
    expect(mockSentry.captureException).toHaveBeenCalledTimes(2)
    expect(mockSentry.init.mock.invocationCallOrder[0]).toBeLessThan(
      mockSentry.captureException.mock.invocationCallOrder[0]
    )
  })

  it('does nothing when no DSN is configured', async () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    const client = await freshClient()

    client.withSentry((Sentry) => Sentry.captureException(new Error('boom')))
    client.onSentryReady((Sentry) => Sentry.setUser(null))
    expect(await client.loadSentry()).toBeNull()

    expect(mockSentry.init).not.toHaveBeenCalled()
    expect(mockSentry.captureException).not.toHaveBeenCalled()
  })

  it('applies context registered after the SDK has started', async () => {
    const client = await freshClient()
    await client.loadSentry()

    client.onSentryReady((Sentry) => Sentry.setUser({ id: 'u2' }))
    await flush()

    expect(mockSentry.setUser).toHaveBeenCalledWith({ id: 'u2' })
  })

  describe('beforeSend', () => {
    async function beforeSend() {
      const client = await freshClient()
      await client.loadSentry()
      const [options] = mockSentry.init.mock.calls[0] as unknown as [
        { beforeSend: (event: Record<string, unknown>, hint: { originalException?: unknown }) => unknown },
      ]
      return options.beforeSend
    }

    it('drops navigation cancellations', async () => {
      const send = await beforeSend()
      expect(send({}, { originalException: new Error('AbortError: cancelled') })).toBeNull()
    })

    it('tags events with the platform and keeps existing app context', async () => {
      const send = await beforeSend()
      const event = { contexts: { app: { app_name: 'learn' } } }
      expect(send(event, { originalException: new Error('boom') })).toEqual({
        contexts: { app: { app_name: 'learn', platform: 'VivanceData Learning Platform' } },
      })
    })

    it('passes events without contexts through unchanged', async () => {
      const send = await beforeSend()
      const event = { message: 'hello' }
      expect(send(event, {})).toBe(event)
    })
  })
})
