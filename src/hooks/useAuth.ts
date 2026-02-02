'use client'

import { useCallback } from 'react'
import { useAuth as useAuthContext } from '@/contexts/AuthContext'

// Re-export the main useAuth hook
export { useAuth } from '@/contexts/AuthContext'

// Re-export types
export type { User, AuthContextType } from '@/contexts/AuthContext'

/**
 * Hook to check if user is authenticated
 * Returns a simple boolean for components that only need auth status
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext()
  return isAuthenticated
}

/**
 * Hook that returns the current user or throws if not authenticated
 * Use this in protected pages/components where auth is required
 */
export function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuthContext()

  if (!loading && !isAuthenticated) {
    throw new Error('Authentication required')
  }

  return { user, loading, isAuthenticated }
}

/**
 * Hook that provides login with redirect functionality
 * @param onSuccess - Optional callback to run after successful login
 */
export function useLogin(onSuccess?: () => void) {
  const { login, loading, error, clearError } = useAuthContext()

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await login(email, password)
        onSuccess?.()
      } catch {
        // Error is already set in context
      }
    },
    [login, onSuccess]
  )

  return {
    login: handleLogin,
    loading,
    error,
    clearError,
  }
}

/**
 * Hook that provides signup with redirect functionality
 * @param onSuccess - Optional callback to run after successful signup
 */
export function useSignup(onSuccess?: () => void) {
  const { signup, loading, error, clearError } = useAuthContext()

  const handleSignup = useCallback(
    async (
      email: string,
      password: string,
      name?: string,
      githubUsername?: string
    ) => {
      try {
        await signup(email, password, name, githubUsername)
        onSuccess?.()
      } catch {
        // Error is already set in context
      }
    },
    [signup, onSuccess]
  )

  return {
    signup: handleSignup,
    loading,
    error,
    clearError,
  }
}

/**
 * Hook that provides logout functionality
 * @param onSuccess - Optional callback to run after successful logout
 */
export function useLogout(onSuccess?: () => void) {
  const { logout, loading } = useAuthContext()

  const handleLogout = useCallback(async () => {
    await logout()
    onSuccess?.()
  }, [logout, onSuccess])

  return {
    logout: handleLogout,
    loading,
  }
}
