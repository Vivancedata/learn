'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// ============================================================================
// Types
// ============================================================================

export interface Subscription {
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
}

export interface SubscriptionContextType {
  subscription: Subscription | null
  isSubscribed: boolean
  isPro: boolean
  plan: 'free' | 'pro'
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isTrialing: boolean
  daysUntilExpiry: number | null
  willCancel: boolean
}

// ============================================================================
// Context
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// ============================================================================
// Provider
// ============================================================================

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/subscription/status', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.data.subscription)
      } else {
        setSubscription(null)
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err)
      setError('Failed to load subscription status')
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch subscription when auth changes
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription, user])

  // Computed values
  const isPro = useMemo(() => {
    if (!subscription) return false
    return subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'past_due'
  }, [subscription])

  const isSubscribed = useMemo(() => {
    return !!subscription && subscription.status !== 'incomplete'
  }, [subscription])

  const isTrialing = useMemo(() => {
    return subscription?.status === 'trialing'
  }, [subscription])

  const willCancel = useMemo(() => {
    return subscription?.cancelAtPeriodEnd || false
  }, [subscription])

  const daysUntilExpiry = useMemo(() => {
    if (!subscription?.currentPeriodEnd) return null
    const endDate = new Date(subscription.currentPeriodEnd)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }, [subscription])

  const plan = useMemo((): 'free' | 'pro' => {
    return isPro ? 'pro' : 'free'
  }, [isPro])

  const contextValue = useMemo(
    () => ({
      subscription,
      isSubscribed,
      isPro,
      plan,
      loading,
      error,
      refresh: fetchSubscription,
      isTrialing,
      daysUntilExpiry,
      willCancel,
    }),
    [
      subscription,
      isSubscribed,
      isPro,
      plan,
      loading,
      error,
      fetchSubscription,
      isTrialing,
      daysUntilExpiry,
      willCancel,
    ]
  )

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
