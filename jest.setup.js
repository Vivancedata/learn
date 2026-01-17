// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill TextEncoder/TextDecoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars'

// Polyfill Response for Node.js environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body
      this.status = init.status || 200
      this.statusText = init.statusText || ''
      this.headers = new Map(Object.entries(init.headers || {}))
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }

    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
    }
  }
}

// Polyfill Request for Node.js environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map(Object.entries(init.headers || {}))
      this._body = init.body
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }
  }
}

// Polyfill Headers for Node.js environment
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      }
    }

    get(name) {
      return this._headers.get(name.toLowerCase()) || null
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), value)
    }

    has(name) {
      return this._headers.has(name.toLowerCase())
    }
  }
}

// Mock next/server module
jest.mock('next/server', () => {
  class MockNextRequest {
    constructor(url, init = {}) {
      this.url = url
      this.nextUrl = new URL(url)
      this.method = init.method || 'GET'
      this._headers = new Map()
      this._body = init.body

      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      }

      this.headers = {
        get: (name) => this._headers.get(name.toLowerCase()) || null,
        set: (name, value) => this._headers.set(name.toLowerCase(), value),
        has: (name) => this._headers.has(name.toLowerCase()),
      }
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }
  }

  class MockNextResponse {
    constructor(body, init = {}) {
      this._body = body
      this.status = init.status || 200
      this._headers = new Map()

      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      }

      this.headers = {
        get: (name) => this._headers.get(name.toLowerCase()) || null,
        set: (name, value) => this._headers.set(name.toLowerCase(), value),
        has: (name) => this._headers.has(name.toLowerCase()),
      }
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }

    static json(data, init = {}) {
      return new MockNextResponse(data, init)
    }

    static next(options = {}) {
      const response = new MockNextResponse(null, { status: 200 })
      if (options.request?.headers) {
        // Copy headers from request options
      }
      return response
    }
  }

  return {
    __esModule: true,
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  }
})

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Silence console errors during tests (optional)
// console.error = jest.fn()
