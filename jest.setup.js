// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock the next/server module completely (don't use requireActual as it needs Web APIs)
jest.mock('next/server', () => {
  return {
    __esModule: true,
    NextResponse: {
      json: jest.fn((data, options = {}) => {
        return {
          status: options.status || 200,
          headers: options.headers || {},
          json: async () => data,
        }
      }),
      next: jest.fn(() => ({
        status: 200,
      })),
      redirect: jest.fn((url) => ({
        status: 307,
        headers: { location: url },
      })),
    },
    NextRequest: jest.fn().mockImplementation((url, init = {}) => {
      const headers = new Map()
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          headers.set(key.toLowerCase(), value)
        })
      }
      return {
        url,
        method: init.method || 'GET',
        nextUrl: new URL(url),
        headers: {
          get: (key) => headers.get(key.toLowerCase()),
          set: (key, value) => headers.set(key.toLowerCase(), value),
        },
        cookies: new Map(),
        json: init.body ? async () => JSON.parse(init.body) : async () => ({}),
      }
    }),
  }
})

// Mock Request class for tests
class MockRequest {
  constructor(url, init = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.nextUrl = new URL(url)
    this.headers = new Map()
    this.cookies = new Map()
    this._body = init.body
  }

  async json() {
    return this._body ? JSON.parse(this._body) : {}
  }
}

global.Request = MockRequest
