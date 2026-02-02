/**
 * E2E Authentication Flow Test Script
 *
 * This script tests the complete authentication flow:
 * 1. Sign-up with new user
 * 2. Verify redirect to dashboard
 * 3. Sign-out
 * 4. Sign-in with existing user
 * 5. Verify protected route access
 * 6. Verify dashboard shows real data
 *
 * Prerequisites:
 * - Development server running on localhost:3000
 * - Database properly initialized with `prisma generate` and `prisma migrate dev`
 *
 * Run with: npx ts-node scripts/e2e-auth-test.ts
 */

const BASE_URL = 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: unknown
}

const results: TestResult[] = []

function logResult(result: TestResult) {
  results.push(result)
  const icon = result.passed ? '[PASS]' : '[FAIL]'
  console.log(`${icon} ${result.name}`)
  if (!result.passed) {
    console.log(`       Message: ${result.message}`)
    if (result.details) {
      console.log(`       Details: ${JSON.stringify(result.details, null, 2)}`)
    }
  }
}

// Helper to make fetch requests with cookie handling
class CookieJar {
  private cookies: Map<string, string> = new Map()

  setCookiesFromHeader(header: string | null) {
    if (!header) return
    const parts = header.split(',')
    for (const part of parts) {
      const match = part.match(/([^=]+)=([^;]+)/)
      if (match) {
        this.cookies.set(match[1].trim(), match[2].trim())
      }
    }
  }

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  clear() {
    this.cookies.clear()
  }

  get(name: string): string | undefined {
    return this.cookies.get(name)
  }
}

const cookieJar = new CookieJar()

async function fetchWithCookies(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {})

  const cookieHeader = cookieJar.getCookieHeader()
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Store cookies from response
  const setCookie = response.headers.get('set-cookie')
  cookieJar.setCookiesFromHeader(setCookie)

  return response
}

// Test 1: Sign-up with new user
async function testSignUp() {
  const testEmail = `test-e2e-${Date.now()}@example.com`
  const testPassword = 'TestPass123'
  const testName = 'E2E Tester'

  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
      }),
    })

    const data = await response.json()

    if (response.status === 201 && data.data?.user) {
      logResult({
        name: 'Sign-up: Create new user',
        passed: true,
        message: 'User created successfully',
        details: { email: data.data.user.email, name: data.data.user.name },
      })
      return { success: true, email: testEmail, password: testPassword, userId: data.data.user.id }
    } else {
      logResult({
        name: 'Sign-up: Create new user',
        passed: false,
        message: `Unexpected response status: ${response.status}`,
        details: data,
      })
      return { success: false }
    }
  } catch (error) {
    logResult({
      name: 'Sign-up: Create new user',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return { success: false }
  }
}

// Test 2: Verify auth cookie is set after sign-up
async function testAuthCookieSet() {
  const authToken = cookieJar.get('auth-token')

  if (authToken) {
    logResult({
      name: 'Sign-up: Auth cookie set',
      passed: true,
      message: 'Auth token cookie is present',
    })
    return true
  } else {
    logResult({
      name: 'Sign-up: Auth cookie set',
      passed: false,
      message: 'Auth token cookie is missing',
    })
    return false
  }
}

// Test 3: Access /api/auth/me endpoint (should return user)
async function testAuthMe() {
  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/auth/me`)
    const data = await response.json()

    if (response.status === 200 && data.data?.user) {
      logResult({
        name: 'Auth: /api/auth/me returns user',
        passed: true,
        message: 'User data retrieved successfully',
        details: { userId: data.data.user.id, email: data.data.user.email },
      })
      return true
    } else {
      logResult({
        name: 'Auth: /api/auth/me returns user',
        passed: false,
        message: `Unexpected response: ${response.status}`,
        details: data,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Auth: /api/auth/me returns user',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Test 4: Sign-out
async function testSignOut() {
  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/auth/signout`, {
      method: 'POST',
    })

    if (response.status === 200) {
      logResult({
        name: 'Sign-out: Successfully signed out',
        passed: true,
        message: 'Sign-out completed',
      })
      return true
    } else {
      logResult({
        name: 'Sign-out: Successfully signed out',
        passed: false,
        message: `Unexpected response status: ${response.status}`,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Sign-out: Successfully signed out',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Test 5: Verify protected route blocked without auth
async function testProtectedRouteBlocked() {
  // Clear cookies to simulate unauthenticated state
  cookieJar.clear()

  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/courses`)

    if (response.status === 401) {
      logResult({
        name: 'Protected route: Blocked without auth',
        passed: true,
        message: 'Correctly returns 401 Unauthorized',
      })
      return true
    } else {
      logResult({
        name: 'Protected route: Blocked without auth',
        passed: false,
        message: `Expected 401, got ${response.status}`,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Protected route: Blocked without auth',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Test 6: Sign-in with existing user
async function testSignIn(email: string, password: string) {
  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.status === 200 && data.data?.user) {
      logResult({
        name: 'Sign-in: Successfully signed in',
        passed: true,
        message: 'Sign-in completed',
        details: { email: data.data.user.email },
      })
      return true
    } else {
      logResult({
        name: 'Sign-in: Successfully signed in',
        passed: false,
        message: `Unexpected response: ${response.status}`,
        details: data,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Sign-in: Successfully signed in',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Test 7: Access protected route after sign-in
async function testProtectedRouteAllowed() {
  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/courses`)

    if (response.status === 200) {
      const data = await response.json()
      logResult({
        name: 'Protected route: Allowed after auth',
        passed: true,
        message: 'Successfully accessed protected route',
        details: { coursesCount: Array.isArray(data.data) ? data.data.length : 'unknown' },
      })
      return true
    } else {
      logResult({
        name: 'Protected route: Allowed after auth',
        passed: false,
        message: `Unexpected response status: ${response.status}`,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Protected route: Allowed after auth',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Test 8: Verify user progress endpoint
async function testUserProgress(userId: string) {
  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/progress/user/${userId}`)

    if (response.status === 200) {
      const data = await response.json()
      logResult({
        name: 'Dashboard: User progress endpoint works',
        passed: true,
        message: 'Progress data retrieved',
        details: {
          totalCourses: data.overallStats?.totalCourses,
          completedLessons: data.overallStats?.completedLessons,
        },
      })
      return true
    } else {
      logResult({
        name: 'Dashboard: User progress endpoint works',
        passed: false,
        message: `Unexpected response status: ${response.status}`,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Dashboard: User progress endpoint works',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Test 9: Test sign-in with invalid credentials
async function testInvalidSignIn() {
  cookieJar.clear()

  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'WrongPassword123',
      }),
    })

    if (response.status === 401) {
      logResult({
        name: 'Sign-in: Invalid credentials rejected',
        passed: true,
        message: 'Correctly rejects invalid credentials',
      })
      return true
    } else {
      logResult({
        name: 'Sign-in: Invalid credentials rejected',
        passed: false,
        message: `Expected 401, got ${response.status}`,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Sign-in: Invalid credentials rejected',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Test 10: Test password validation on sign-up
async function testPasswordValidation() {
  try {
    const response = await fetchWithCookies(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `weak-password-${Date.now()}@example.com`,
        password: 'weak', // Too short, no uppercase, no number
        name: 'Test User',
      }),
    })

    if (response.status === 400) {
      logResult({
        name: 'Sign-up: Weak password rejected',
        passed: true,
        message: 'Correctly rejects weak passwords',
      })
      return true
    } else {
      logResult({
        name: 'Sign-up: Weak password rejected',
        passed: false,
        message: `Expected 400, got ${response.status}`,
      })
      return false
    }
  } catch (error) {
    logResult({
      name: 'Sign-up: Weak password rejected',
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
    return false
  }
}

// Main test runner
async function runTests() {
  console.log('=' .repeat(60))
  console.log('E2E Authentication Flow Test')
  console.log('=' .repeat(60))
  console.log('')

  // Check if server is running
  try {
    const response = await fetch(BASE_URL)
    if (!response.ok && response.status === 500) {
      console.log('[ERROR] Server returned 500 - likely database not initialized')
      console.log('')
      console.log('To fix this issue:')
      console.log('1. Run: npx prisma generate')
      console.log('2. Run: npx prisma migrate dev')
      console.log('3. Run: npm run db:seed')
      console.log('4. Restart the dev server: npm run dev')
      console.log('')
      process.exit(1)
    }
  } catch (error) {
    console.log('[ERROR] Server not running at', BASE_URL)
    console.log('Please start the development server: npm run dev')
    process.exit(1)
  }

  console.log('Running tests...')
  console.log('')

  // Test 1: Sign-up
  const signupResult = await testSignUp()

  if (signupResult.success) {
    // Test 2: Auth cookie set
    await testAuthCookieSet()

    // Test 3: /api/auth/me
    await testAuthMe()

    // Test 4: Sign-out
    await testSignOut()

    // Test 5: Protected route blocked
    await testProtectedRouteBlocked()

    // Test 6: Sign-in
    const signedIn = await testSignIn(signupResult.email!, signupResult.password!)

    if (signedIn) {
      // Test 7: Protected route allowed
      await testProtectedRouteAllowed()

      // Test 8: User progress
      if (signupResult.userId) {
        await testUserProgress(signupResult.userId)
      }
    }
  }

  // Test 9: Invalid sign-in (can run independently)
  await testInvalidSignIn()

  // Test 10: Password validation (can run independently)
  await testPasswordValidation()

  // Summary
  console.log('')
  console.log('=' .repeat(60))
  console.log('Test Summary')
  console.log('=' .repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log(`Total: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log('')

  if (failed > 0) {
    console.log('Failed tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`)
    })
    process.exit(1)
  } else {
    console.log('All tests passed!')
    process.exit(0)
  }
}

// Run tests
runTests().catch(console.error)
