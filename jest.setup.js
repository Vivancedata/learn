// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock the NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server')
  return {
    __esModule: true,
    ...originalModule,
    NextResponse: {
      json: jest.fn((data, options = {}) => {
        return {
          status: options.status || 200,
          json: async () => data,
        }
      }),
    },
  }
})

// Mock the NextRequest
class MockRequest {
  constructor(url) {
    this.url = url
    this.nextUrl = new URL(url)
  }
}

global.Request = MockRequest
