'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'
import * as Sentry from '@sentry/nextjs'
import { analytics } from '@/lib/analytics'

export interface User {
  id: string
  email: string
  name?: string
  githubUsername?: string
  createdAt?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string, githubUsername?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Computed property for authentication status
  const isAuthenticated = useMemo(() => !!user, [user])

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
        setUser(data.data.user)
      } else {
        setUser(null)
      }
    } catch (_err) {
      // Auth check failed - user not logged in
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch current user on mount
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Update Sentry user context when user changes
  useEffect(() => {
    if (user) {
      // Set user context in Sentry for error tracking
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name || user.email,
      })

      // Add breadcrumb for login
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'User authenticated',
        level: 'info',
        data: {
          userId: user.id,
        },
      })
    } else {
      // Clear Sentry user context on logout
      Sentry.setUser(null)
    }
  }, [user])

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
  ) => {
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

      const newUser = data.data.user
      setUser(newUser)

      // Track sign up with PostHog analytics
      analytics.identify(newUser.id, {
        email: newUser.email,
        name: newUser.name || undefined,
        github_username: newUser.githubUsername || undefined,
        signup_date: new Date().toISOString(),
      })
      analytics.trackUserSignedUp({ signup_method: 'email', plan_type: 'free' })
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

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      login,
      signup,
      logout,
      refreshUser,
      clearError,
    }),
    [user, loading, error, isAuthenticated, refreshUser, clearError]
  )

  return (
    <AuthContext.Provider value={contextValue}>
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
