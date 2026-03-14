import { getAppUrl } from '../app-url'

describe('getAppUrl', () => {
  const originalEnv = process.env
  const getMutableEnv = () => process.env as Record<string, string | undefined>

  beforeEach(() => {
    process.env = { ...originalEnv }
    const env = getMutableEnv()
    delete env.NEXT_PUBLIC_APP_URL
    delete env.NODE_ENV
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns localhost fallback outside production when NEXT_PUBLIC_APP_URL is missing', () => {
    getMutableEnv().NODE_ENV = 'development'
    expect(getAppUrl()).toBe('http://localhost:3000')
  })

  it('throws when NEXT_PUBLIC_APP_URL is missing in production', () => {
    getMutableEnv().NODE_ENV = 'production'
    expect(() => getAppUrl()).toThrow('NEXT_PUBLIC_APP_URL environment variable is required in production.')
  })

  it('normalizes a trailing slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://learn.example.com/'
    expect(getAppUrl()).toBe('https://learn.example.com')
  })

  it('throws when NEXT_PUBLIC_APP_URL is not a valid absolute URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'not-a-url'
    expect(() => getAppUrl()).toThrow('NEXT_PUBLIC_APP_URL must be a valid absolute URL.')
  })
})
