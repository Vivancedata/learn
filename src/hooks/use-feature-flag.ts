'use client'

import { usePostHog, useFeatureFlagEnabled, useFeatureFlagPayload } from 'posthog-js/react'
import { useEffect, useState, useCallback } from 'react'

/**
 * Feature flag names used in the application
 * Add new feature flags here for type safety
 */
export const FEATURE_FLAGS = {
  // A/B testing
  NEW_PRICING_PAGE: 'new-pricing-page',
  NEW_CHECKOUT_FLOW: 'new-checkout-flow',
  NEW_DASHBOARD_DESIGN: 'new-dashboard-design',

  // Feature rollouts
  ENABLE_DISCUSSIONS: 'enable-discussions',
  ENABLE_ACHIEVEMENTS: 'enable-achievements',
  ENABLE_STREAKS: 'enable-streaks',
  ENABLE_LEADERBOARD: 'enable-leaderboard',
  ENABLE_SKILL_ASSESSMENTS: 'enable-skill-assessments',

  // Experiments
  SHOW_SOCIAL_PROOF: 'show-social-proof',
  GAMIFICATION_LEVEL: 'gamification-level',
  ONBOARDING_VARIANT: 'onboarding-variant',
} as const

export type FeatureFlagName = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS]

/**
 * Hook to check if a feature flag is enabled
 *
 * @param flagName - The name of the feature flag to check
 * @returns boolean indicating if the flag is enabled
 *
 * @example
 * ```tsx
 * function PricingPage() {
 *   const showNewPricing = useFeatureFlag('new-pricing-page')
 *
 *   if (showNewPricing) {
 *     return <NewPricingPage />
 *   }
 *   return <OldPricingPage />
 * }
 * ```
 */
export function useFeatureFlag(flagName: string): boolean {
  const isEnabled = useFeatureFlagEnabled(flagName)

  // Return false if undefined (flag not loaded yet)
  return isEnabled ?? false
}

/**
 * Hook to get the payload of a feature flag
 * Useful for multivariate flags that return different values
 *
 * @param flagName - The name of the feature flag
 * @returns The payload value or undefined
 *
 * @example
 * ```tsx
 * function CheckoutFlow() {
 *   const variant = useFeatureFlagPayloadValue('checkout-variant')
 *
 *   switch (variant) {
 *     case 'simplified':
 *       return <SimplifiedCheckout />
 *     case 'detailed':
 *       return <DetailedCheckout />
 *     default:
 *       return <DefaultCheckout />
 *   }
 * }
 * ```
 */
export function useFeatureFlagPayloadValue<T = unknown>(flagName: string): T | undefined {
  const payload = useFeatureFlagPayload(flagName)
  return payload as T | undefined
}

/**
 * Hook to get feature flag with loading state
 * Useful when you need to show a loading state while flags are being fetched
 *
 * @param flagName - The name of the feature flag
 * @returns Object with isEnabled, isLoading, and payload
 *
 * @example
 * ```tsx
 * function FeatureComponent() {
 *   const { isEnabled, isLoading } = useFeatureFlagWithLoading('new-feature')
 *
 *   if (isLoading) {
 *     return <Skeleton />
 *   }
 *
 *   if (isEnabled) {
 *     return <NewFeature />
 *   }
 *   return <OldFeature />
 * }
 * ```
 */
export function useFeatureFlagWithLoading(flagName: string): {
  isEnabled: boolean
  isLoading: boolean
  payload: unknown
} {
  const posthog = usePostHog()
  const [isLoading, setIsLoading] = useState(true)
  const [isEnabled, setIsEnabled] = useState(false)
  const [payload, setPayload] = useState<unknown>(undefined)

  useEffect(() => {
    if (!posthog) {
      setIsLoading(false)
      return
    }

    // Check if flags are already loaded
    const checkFlags = () => {
      const flagValue = posthog.isFeatureEnabled(flagName)
      const flagPayload = posthog.getFeatureFlagPayload(flagName)

      if (flagValue !== undefined) {
        setIsEnabled(flagValue)
        setPayload(flagPayload)
        setIsLoading(false)
      }
    }

    // Initial check
    checkFlags()

    // Listen for flag updates
    posthog.onFeatureFlags(() => {
      checkFlags()
    })
  }, [posthog, flagName])

  return { isEnabled, isLoading, payload }
}

/**
 * Hook to get multiple feature flags at once
 *
 * @param flagNames - Array of feature flag names
 * @returns Object mapping flag names to their enabled status
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const flags = useFeatureFlags(['enable-achievements', 'enable-streaks', 'enable-leaderboard'])
 *
 *   return (
 *     <div>
 *       {flags['enable-achievements'] && <AchievementsWidget />}
 *       {flags['enable-streaks'] && <StreakWidget />}
 *       {flags['enable-leaderboard'] && <LeaderboardWidget />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useFeatureFlags(flagNames: string[]): Record<string, boolean> {
  const posthog = usePostHog()
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    // Initialize all flags as false
    return flagNames.reduce((acc, name) => ({ ...acc, [name]: false }), {})
  })

  useEffect(() => {
    if (!posthog) return

    const updateFlags = () => {
      const newFlags = flagNames.reduce((acc, name) => {
        acc[name] = posthog.isFeatureEnabled(name) ?? false
        return acc
      }, {} as Record<string, boolean>)
      setFlags(newFlags)
    }

    // Initial update
    updateFlags()

    // Listen for updates
    posthog.onFeatureFlags(() => {
      updateFlags()
    })
  }, [posthog, flagNames])

  return flags
}

/**
 * Hook to manually reload feature flags
 * Useful after user identification or significant state changes
 *
 * @returns Function to reload feature flags
 */
export function useReloadFeatureFlags(): () => void {
  const posthog = usePostHog()

  return useCallback(() => {
    if (posthog) {
      posthog.reloadFeatureFlags()
    }
  }, [posthog])
}

/**
 * Props for FeatureFlag component
 * Use this in a .tsx file to create feature flag components
 */
export interface FeatureFlagProps {
  flag: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Helper to create a feature flag component
 * Use this factory function to build conditional rendering components
 *
 * @example
 * ```tsx
 * // In a .tsx file
 * const FeatureFlag = createFeatureFlagComponent()
 *
 * function MyPage() {
 *   return (
 *     <FeatureFlag flag="new-feature" fallback={<OldComponent />}>
 *       <NewComponent />
 *     </FeatureFlag>
 *   )
 * }
 * ```
 */
export function createFeatureFlagRenderer(): (
  props: FeatureFlagProps,
  isEnabled: boolean
) => React.ReactNode {
  return (props: FeatureFlagProps, isEnabled: boolean) => {
    if (isEnabled) {
      return props.children
    }
    return props.fallback ?? null
  }
}
