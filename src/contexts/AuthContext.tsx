'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'

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
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch current user on mount
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

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

      setUser(data.data.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
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

      setUser(data.data.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      setError(message)
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

      setUser(null)
    } catch (err) {
      console.error('Logout failed:', err)
      setError('Logout failed')
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
