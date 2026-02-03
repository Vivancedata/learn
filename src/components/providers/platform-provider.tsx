/**
 * Platform Provider Component
 *
 * Context provider for platform detection and native features.
 * Wraps the app to provide platform information and native utilities
 * to all child components.
 *
 * Usage:
 * ```tsx
 * // In layout.tsx
 * <PlatformProvider>
 *   {children}
 * </PlatformProvider>
 *
 * // In any component
 * const { isNative, platform, haptics } = usePlatformContext()
 * ```
 */

'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  isNative,
  getPlatform,
  isIOS,
  isAndroid,
  isWeb,
  hapticImpact,
  hapticNotification,
  hapticSelection,
  setStatusBarStyle,
  setStatusBarColor,
  hideSplashScreen,
  applySafeAreaVariables,
  type HapticStyle,
  type HapticNotificationType,
  type StatusBarStyle,
} from '@/lib/native'
import {
  parseDeepLink,
  handleDeepLink,
  registerDeepLinkHandler,
  type DeepLinkParseResult,
} from '@/lib/deep-links'

// ============================================================================
// Types
// ============================================================================

export interface PlatformContextValue {
  /** Current platform */
  platform: 'ios' | 'android' | 'web'
  /** Whether running as a native app */
  isNative: boolean
  /** Whether running on iOS */
  isIOS: boolean
  /** Whether running on Android */
  isAndroid: boolean
  /** Whether running on web */
  isWeb: boolean
  /** Whether platform detection is complete */
  isReady: boolean
  /** Haptic feedback utilities */
  haptics: {
    impact: (style?: HapticStyle) => Promise<void>
    notification: (type?: HapticNotificationType) => Promise<void>
    selection: () => Promise<void>
  }
  /** Status bar utilities */
  statusBar: {
    setStyle: (style: StatusBarStyle) => Promise<void>
    setColor: (color: string) => Promise<void>
  }
  /** Hide the splash screen */
  hideSplash: () => Promise<void>
}

export interface PlatformProviderProps {
  children: ReactNode
  /** Options for platform initialization */
  options?: {
    /** Auto-hide splash screen on mount (default: true) */
    autoHideSplash?: boolean
    /** Splash screen fade duration in ms (default: 300) */
    splashFadeDuration?: number
    /** Initial status bar style (default: 'dark') */
    statusBarStyle?: StatusBarStyle
    /** Status bar background color for Android (default: '#0f172a') */
    statusBarColor?: string
    /** Handle deep links automatically (default: true) */
    handleDeepLinks?: boolean
  }
}

// ============================================================================
// Context
// ============================================================================

const PlatformContext = createContext<PlatformContextValue | null>(null)

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access platform context
 * @throws Error if used outside PlatformProvider
 */
export function usePlatformContext(): PlatformContextValue {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatformContext must be used within a PlatformProvider')
  }
  return context
}

/**
 * Hook to safely access platform context (returns null if not in provider)
 */
export function usePlatformContextSafe(): PlatformContextValue | null {
  return useContext(PlatformContext)
}

// ============================================================================
// Provider Component
// ============================================================================

export function PlatformProvider({
  children,
  options = {},
}: PlatformProviderProps): React.ReactElement {
  const {
    autoHideSplash = true,
    splashFadeDuration = 300,
    statusBarStyle = 'dark',
    statusBarColor = '#0f172a',
    handleDeepLinks = true,
  } = options

  const router = useRouter()

  // Platform state
  const [platformState, setPlatformState] = useState<{
    platform: 'ios' | 'android' | 'web'
    isNative: boolean
    isIOS: boolean
    isAndroid: boolean
    isWeb: boolean
    isReady: boolean
  }>({
    platform: 'web',
    isNative: false,
    isIOS: false,
    isAndroid: false,
    isWeb: true,
    isReady: false,
  })

  // Initialize platform detection
  useEffect(() => {
    setPlatformState({
      platform: getPlatform(),
      isNative: isNative(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isWeb: isWeb(),
      isReady: true,
    })
  }, [])

  // Initialize native features
  useEffect(() => {
    if (!platformState.isReady) return

    const init = async () => {
      // Apply safe area CSS variables
      applySafeAreaVariables()

      // Configure status bar
      if (platformState.isNative) {
        await setStatusBarStyle(statusBarStyle)
        if (platformState.isAndroid) {
          await setStatusBarColor(statusBarColor)
        }
      }

      // Hide splash screen
      if (autoHideSplash && platformState.isNative) {
        await hideSplashScreen(splashFadeDuration)
      }
    }

    init()
  }, [platformState.isReady, platformState.isNative, platformState.isAndroid, autoHideSplash, splashFadeDuration, statusBarStyle, statusBarColor])

  // Handle deep links
  useEffect(() => {
    if (!handleDeepLinks || !platformState.isReady) return

    const handleLink = (result: DeepLinkParseResult) => {
      if (result.isValid && result.navigationPath) {
        router.push(result.navigationPath)
      }
    }

    // Register handler
    const cleanup = registerDeepLinkHandler(handleLink)

    // Check for initial deep link (app launched via deep link)
    const checkInitialDeepLink = async () => {
      if (!platformState.isNative) return

      try {
        const { App } = await import('@capacitor/app')
        const launchUrl = await App.getLaunchUrl()
        if (launchUrl?.url) {
          handleDeepLink(launchUrl.url)
        }

        // Listen for future deep links
        App.addListener('appUrlOpen', ({ url }) => {
          handleDeepLink(url)
        })
      } catch (error) {
        console.warn('Failed to check initial deep link:', error)
      }
    }

    checkInitialDeepLink()

    return cleanup
  }, [handleDeepLinks, platformState.isReady, platformState.isNative, router])

  // Haptic feedback functions
  const haptics = {
    impact: useCallback(async (style?: HapticStyle) => {
      await hapticImpact(style)
    }, []),
    notification: useCallback(async (type?: HapticNotificationType) => {
      await hapticNotification(type)
    }, []),
    selection: useCallback(async () => {
      await hapticSelection()
    }, []),
  }

  // Status bar functions
  const statusBar = {
    setStyle: useCallback(async (style: StatusBarStyle) => {
      await setStatusBarStyle(style)
    }, []),
    setColor: useCallback(async (color: string) => {
      await setStatusBarColor(color)
    }, []),
  }

  // Hide splash function
  const hideSplash = useCallback(async () => {
    await hideSplashScreen(splashFadeDuration)
  }, [splashFadeDuration])

  // Context value
  const value: PlatformContextValue = {
    ...platformState,
    haptics,
    statusBar,
    hideSplash,
  }

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  )
}

// ============================================================================
// Utility Components
// ============================================================================

export interface PlatformConditionalProps {
  children: ReactNode
  /** Show only on native platforms */
  native?: boolean
  /** Show only on iOS */
  ios?: boolean
  /** Show only on Android */
  android?: boolean
  /** Show only on web */
  web?: boolean
  /** Fallback content when condition is not met */
  fallback?: ReactNode
}

/**
 * Conditionally render content based on platform
 *
 * Usage:
 * ```tsx
 * <PlatformConditional native>
 *   <NativeOnlyFeature />
 * </PlatformConditional>
 *
 * <PlatformConditional ios>
 *   <iOSSpecificUI />
 * </PlatformConditional>
 * ```
 */
export function PlatformConditional({
  children,
  native,
  ios,
  android,
  web,
  fallback = null,
}: PlatformConditionalProps): React.ReactElement | null {
  const context = usePlatformContextSafe()

  // Before context is available, render nothing
  if (!context?.isReady) {
    return null
  }

  // Check conditions
  let shouldRender = false

  if (native && context.isNative) shouldRender = true
  if (ios && context.isIOS) shouldRender = true
  if (android && context.isAndroid) shouldRender = true
  if (web && context.isWeb) shouldRender = true

  // If no specific condition is set, always render
  if (!native && !ios && !android && !web) {
    shouldRender = true
  }

  if (shouldRender) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * Only render children on native platforms (iOS or Android)
 */
export function NativeOnly({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}): React.ReactElement | null {
  return (
    <PlatformConditional native fallback={fallback}>
      {children}
    </PlatformConditional>
  )
}

/**
 * Only render children on web
 */
export function WebOnly({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}): React.ReactElement | null {
  return (
    <PlatformConditional web fallback={fallback}>
      {children}
    </PlatformConditional>
  )
}

// ============================================================================
// Export
// ============================================================================

export default PlatformProvider
