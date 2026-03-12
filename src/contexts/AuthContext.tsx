'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { analytics } from '@/lib/analytics'

const DEFERRED_AUTH_PATHS = [
  '/pricing',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

function shouldDeferAuthBootstrap(pathname: string | null): boolean {
  if (!pathname) {
    return true
  }

  return DEFERRED_AUTH_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export interface User {
  id: string
  email: string
  name?: string
  githubUsername?: string
  createdAt?: string
  emailVerified?: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string, githubUsername?: string) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function syncSentryUser(user: User | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name || user.email,
    })
    return
  }

  Sentry.setUser(null)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const deferAuthBootstrap = shouldDeferAuthBootstrap(pathname)

  const isAuthenticated = !!user

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies
      })

      if (response.ok) {
        const data = await response.json()
        const nextUser = data.data.user as User
        setUser(nextUser)
        syncSentryUser(nextUser)
      } else {
        setUser(null)
        syncSentryUser(null)
      }
    } catch (_err) {
      // Auth check failed - user not logged in
      setUser(null)
      syncSentryUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch current user on mount
  useEffect(() => {
    if (deferAuthBootstrap) {
      setLoading(false)
      return
    }

    void refreshUser()
  }, [deferAuthBootstrap, refreshUser])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      const loggedInUser = data.data.user
      setUser(loggedInUser)
      syncSentryUser(loggedInUser)

      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'User authenticated',
        level: 'info',
        data: {
          userId: loggedInUser.id,
        },
      })

      // Track sign in with PostHog analytics
      analytics.identify(loggedInUser.id, {
        email: loggedInUser.email,
        name: loggedInUser.name || undefined,
        github_username: loggedInUser.githubUsername || undefined,
      })
      analytics.trackUserSignedIn({ signin_method: 'email' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)

      // Track authentication failures in Sentry
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Login failed',
        level: 'warning',
        data: {
          error: message,
        },
      })

      // Track login failure in analytics
      analytics.trackError('auth_error', message, { action: 'login' })

      throw err
    } finally {
      setLoading(false)
    }
  }

  const signup = async (
    email: string,
    password: string,
    name?: string,
    githubUsername?: string
  ): Promise<User> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, githubUsername }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      const newUser = data.data.user as User
      setUser(newUser)
      syncSentryUser(newUser)

      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'User authenticated',
        level: 'info',
        data: {
          userId: newUser.id,
        },
      })

      // Track sign up with PostHog analytics
      analytics.identify(newUser.id, {
        email: newUser.email,
        name: newUser.name || undefined,
        github_username: newUser.githubUsername || undefined,
        signup_date: new Date().toISOString(),
      })
      analytics.trackUserSignedUp({ signup_method: 'email', plan_type: 'free' })

      return newUser
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      setError(message)

      // Track signup failures in Sentry
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Signup failed',
        level: 'warning',
        data: {
          error: message,
        },
      })

      // Track signup failure in analytics
      analytics.trackError('auth_error', message, { action: 'signup' })

      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setError(null)

      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })

      // Add breadcrumb for logout
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'User logged out',
        level: 'info',
      })

      // Track sign out with PostHog analytics and reset identity
      analytics.trackUserSignedOut()
      analytics.reset()

      setUser(null)
      syncSentryUser(null)
    } catch (_err) {
      // Logout API failed - clear local state anyway
      setError('Logout failed')

      // Track logout failures in Sentry
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Logout failed',
        level: 'warning',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
