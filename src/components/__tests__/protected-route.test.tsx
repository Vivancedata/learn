import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const mockReplace = jest.fn()
let mockPathname = '/dashboard'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  usePathname: () => mockPathname,
}))

jest.mock('@sentry/nextjs', () => ({ setUser: jest.fn(), addBreadcrumb: jest.fn() }))
jest.mock('@/lib/analytics', () => ({
  analytics: { identify: jest.fn(), reset: jest.fn(), track: jest.fn() },
}))

const signedInUser = { id: 'user-1', email: 'a@example.com', name: 'A', emailVerified: true }

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mountCount = 0
let refresh: (() => Promise<void>) | null = null

function Page() {
  const { refreshUser } = useAuth()
  useEffect(() => {
    refresh = refreshUser
  }, [refreshUser])
  return <p data-testid="page">protected content</p>
}

function Tree({ isPublicPage = false }: { isPublicPage?: boolean }) {
  return (
    <AuthProvider>
      {isPublicPage ? (
        <p>pricing</p>
      ) : (
        <ProtectedRoute>
          <MountProbe />
          <Page />
        </ProtectedRoute>
      )}
    </AuthProvider>
  )
}

function MountProbe() {
  useEffect(() => {
    mountCount += 1
  }, [])
  return null
}

let container: HTMLDivElement
let root: Root

const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
})

beforeEach(() => {
  mockReplace.mockClear()
  mountCount = 0
  refresh = null
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ data: { user: signedInUser } }),
  })) as unknown as typeof fetch
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ProtectedRoute', () => {
  it('does not bounce a signed-in user who arrives from a page that skipped the auth check', async () => {
    mockPathname = '/pricing' // auth bootstrap is deferred here
    await act(async () => root.render(<Tree isPublicPage />))
    await flush()

    mockPathname = '/dashboard'
    await act(async () => root.render(<Tree />))
    await flush()

    expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining('/sign-in'))
    expect(container.textContent).toContain('protected content')
  })

  it('keeps the page mounted while refreshing an already signed-in user', async () => {
    mockPathname = '/dashboard'
    await act(async () => root.render(<Tree />))
    await flush()
    expect(mountCount).toBe(1)

    // Hold the refresh request open to observe the page mid-refresh
    let release: () => void = () => {}
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, json: async () => ({ data: { user: signedInUser } }) })
        })
    ) as unknown as typeof fetch

    let pending: Promise<void> | undefined
    act(() => {
      pending = refresh?.()
    })
    await flush()
    expect(container.textContent).toContain('protected content')

    await act(async () => {
      release()
      await pending
    })

    expect(mountCount).toBe(1)
  })

  it('sends a signed-out visitor to sign-in with a return path', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch
    mockPathname = '/dashboard'

    await act(async () => root.render(<Tree />))
    await flush()

    expect(mockReplace).toHaveBeenCalledWith('/sign-in?redirect=%2Fdashboard')
  })
})
