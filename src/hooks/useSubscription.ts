'use client'

import { useCallback, useMemo } from 'react'
import { useSubscription as useSubscriptionContext } from '@/contexts/SubscriptionContext'
import { redirectToCheckout, redirectToPortal } from '@/lib/stripe-client'

// Re-export the main useSubscription hook
export { useSubscription } from '@/contexts/SubscriptionContext'

// Re-export types
export type { Subscription, SubscriptionContextType } from '@/contexts/SubscriptionContext'

/**
 * Hook to check if user has Pro access
 * Returns a simple boolean for components that only need pro status
 */
export function useIsPro(): boolean {
  const { isPro } = useSubscriptionContext()
  return isPro
}

/**
 * Hook to get the current plan name
 */
export function usePlan(): 'free' | 'pro' {
  const { plan } = useSubscriptionContext()
  return plan
}

/**
 * Hook for subscription management actions
 */
export function useSubscriptionActions() {
  const { refresh, isPro, isSubscribed } = useSubscriptionContext()

  const startCheckout = useCallback(async (priceId: string) => {
    await redirectToCheckout(priceId)
  }, [])

  const openPortal = useCallback(async () => {
    if (!isSubscribed) {
      throw new Error('No subscription to manage')
    }
    await redirectToPortal()
  }, [isSubscribed])

  return {
    startCheckout,
    openPortal,
    refresh,
    isPro,
    isSubscribed,
  }
}

/**
 * Hook to check subscription status and show appropriate UI
 * Useful for conditional rendering based on subscription status
 */
export function useSubscriptionStatus() {
  const {
    subscription,
    isPro,
    isTrialing,
    willCancel,
    daysUntilExpiry,
    loading,
  } = useSubscriptionContext()

  const statusMessage = useMemo(() => {
    if (loading) return null

    if (!isPro) {
      return {
        type: 'info' as const,
        message: 'Upgrade to Pro for unlimited access',
      }
    }

    if (isTrialing) {
      const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null
      const daysLeft = trialEnd
        ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0

      if (daysLeft <= 3) {
        return {
          type: 'warning' as const,
          message: `Your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        }
      }
      return {
        type: 'info' as const,
        message: `Trial: ${daysLeft} days remaining`,
      }
    }

    if (willCancel && daysUntilExpiry !== null) {
      if (daysUntilExpiry <= 7) {
        return {
          type: 'warning' as const,
          message: `Your subscription ends in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
        }
      }
      return {
        type: 'info' as const,
        message: 'Your subscription will not renew',
      }
    }

    if (subscription?.status === 'past_due') {
      return {
        type: 'error' as const,
        message: 'Payment failed. Please update your payment method.',
      }
    }

    return null
  }, [isPro, isTrialing, willCancel, daysUntilExpiry, subscription, loading])

  return {
    subscription,
    isPro,
    isTrialing,
    willCancel,
    daysUntilExpiry,
    statusMessage,
    loading,
  }
}
