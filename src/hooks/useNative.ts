/**
 * Native Hooks for Capacitor
 *
 * React hooks for integrating with native device features.
 * These hooks safely handle both native and web contexts.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { PluginListenerHandle } from '@capacitor/core'
import {
  isNative,
  getPlatform,
  isIOS,
  isAndroid,
  isWeb,
  onBackButton,
  onAppStateChange,
  onKeyboardShow,
  onKeyboardHide,
  onNetworkChange,
  isOnline,
  hapticImpact,
  hapticNotification,
  hapticSelection,
  setStatusBarStyle,
  setStatusBarColor,
  hideSplashScreen,
  getSafeAreaInsets,
  applySafeAreaVariables,
  type HapticStyle,
  type HapticNotificationType,
  type StatusBarStyle,
  type KeyboardInfo,
  type SafeAreaInsets,
} from '@/lib/native'

// ============================================================================
// usePlatform - Platform detection hook
// ============================================================================

export interface PlatformInfo {
  platform: 'ios' | 'android' | 'web'
  isNative: boolean
  isIOS: boolean
  isAndroid: boolean
  isWeb: boolean
}

/**
 * Hook to detect the current platform
 * @returns Platform information
 */
export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: 'web',
    isNative: false,
    isIOS: false,
    isAndroid: false,
    isWeb: true,
  })

  useEffect(() => {
    setPlatformInfo({
      platform: getPlatform(),
      isNative: isNative(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isWeb: isWeb(),
    })
  }, [])

  return platformInfo
}

// ============================================================================
// useBackButton - Android hardware back button
// ============================================================================

export interface BackButtonOptions {
  /** Handler called when back button is pressed */
  onBack: () => void
  /** Priority of this handler (higher = handled first) */
  priority?: number
  /** Whether this handler is currently active */
  enabled?: boolean
}

/**
 * Hook to handle Android hardware back button
 * @param options - Back button configuration
 */
export function useBackButton(options: BackButtonOptions): void {
  const { onBack, enabled = true } = options
  const listenerRef = useRef<PluginListenerHandle | null>(null)

  useEffect(() => {
    if (!enabled) return

    const setupListener = async () => {
      listenerRef.current = await onBackButton(onBack)
    }

    setupListener()

    return () => {
      listenerRef.current?.remove()
    }
  }, [onBack, enabled])
}

// ============================================================================
// useAppState - App foreground/background state
// ============================================================================

export interface AppStateInfo {
  /** Whether the app is currently in the foreground */
  isActive: boolean
  /** Whether the app has ever been backgrounded in this session */
  wasBackgrounded: boolean
}

/**
 * Hook to track app foreground/background state
 * @returns App state information
 */
export function useAppState(): AppStateInfo {
  const [state, setState] = useState<AppStateInfo>({
    isActive: true,
    wasBackgrounded: false,
  })
  const listenerRef = useRef<PluginListenerHandle | null>(null)

  useEffect(() => {
    const setupListener = async () => {
      listenerRef.current = await onAppStateChange(({ isActive }) => {
        setState(prev => ({
          isActive,
          wasBackgrounded: prev.wasBackgrounded || !isActive,
        }))
      })
    }

    setupListener()

    return () => {
      listenerRef.current?.remove()
    }
  }, [])

  return state
}

// ============================================================================
// useKeyboard - Keyboard visibility and height
// ============================================================================

export interface KeyboardState {
  /** Whether the keyboard is currently visible */
  isVisible: boolean
  /** Height of the keyboard in pixels */
  keyboardHeight: number
}

/**
 * Hook to track keyboard visibility and height
 * @returns Keyboard state
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
  })

  const showListenerRef = useRef<PluginListenerHandle | null>(null)
  const hideListenerRef = useRef<PluginListenerHandle | null>(null)

  useEffect(() => {
    const setupListeners = async () => {
      showListenerRef.current = await onKeyboardShow((info: KeyboardInfo) => {
        setState({
          isVisible: true,
          keyboardHeight: info.keyboardHeight,
        })
      })

      hideListenerRef.current = await onKeyboardHide(() => {
        setState({
          isVisible: false,
          keyboardHeight: 0,
        })
      })
    }

    setupListeners()

    return () => {
      showListenerRef.current?.remove()
      hideListenerRef.current?.remove()
    }
  }, [])

  return state
}

// ============================================================================
// useNetworkStatus - Online/offline detection
// ============================================================================

export interface NetworkStatus {
  /** Whether the device is online */
  isOnline: boolean
  /** Whether the network status has been checked */
  isReady: boolean
}

/**
 * Hook to track network connectivity status
 * @returns Network status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isReady: false,
  })

  useEffect(() => {
    // Set initial status
    setStatus({
      isOnline: isOnline(),
      isReady: true,
    })

    // Listen for changes
    const cleanup = onNetworkChange(online => {
      setStatus({
        isOnline: online,
        isReady: true,
      })
    })

    return cleanup
  }, [])

  return status
}

// ============================================================================
// useHaptics - Haptic feedback helpers
// ============================================================================

export interface HapticsHelpers {
  /** Trigger impact feedback */
  impact: (style?: HapticStyle) => Promise<void>
  /** Trigger notification feedback */
  notification: (type?: HapticNotificationType) => Promise<void>
  /** Trigger selection feedback */
  selection: () => Promise<void>
}

/**
 * Hook providing haptic feedback functions
 * @returns Haptics helper functions
 */
export function useHaptics(): HapticsHelpers {
  const impact = useCallback(async (style?: HapticStyle) => {
    await hapticImpact(style)
  }, [])

  const notification = useCallback(async (type?: HapticNotificationType) => {
    await hapticNotification(type)
  }, [])

  const selection = useCallback(async () => {
    await hapticSelection()
  }, [])

  return { impact, notification, selection }
}

// ============================================================================
// useStatusBar - Status bar control
// ============================================================================

export interface StatusBarHelpers {
  /** Set status bar style */
  setStyle: (style: StatusBarStyle) => Promise<void>
  /** Set status bar background color (Android only) */
  setColor: (color: string) => Promise<void>
}

/**
 * Hook providing status bar control functions
 * @returns Status bar helper functions
 */
export function useStatusBar(): StatusBarHelpers {
  const setStyle = useCallback(async (style: StatusBarStyle) => {
    await setStatusBarStyle(style)
  }, [])

  const setColor = useCallback(async (color: string) => {
    await setStatusBarColor(color)
  }, [])

  return { setStyle, setColor }
}

// ============================================================================
// useSplashScreen - Splash screen control
// ============================================================================

/**
 * Hook to automatically hide splash screen when app is ready
 * @param ready - Whether the app is ready to be shown
 * @param fadeOutDuration - Duration of fade out animation in ms
 */
export function useSplashScreen(ready: boolean = true, fadeOutDuration: number = 300): void {
  useEffect(() => {
    if (ready) {
      hideSplashScreen(fadeOutDuration)
    }
  }, [ready, fadeOutDuration])
}

// ============================================================================
// useSafeArea - Safe area insets for notches, etc.
// ============================================================================

/**
 * Hook to get safe area insets
 * Applies CSS variables on mount
 * @returns Safe area insets
 */
export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })

  useEffect(() => {
    // Apply CSS variables
    applySafeAreaVariables()

    // Get initial insets after a short delay to allow CSS to be applied
    const timer = setTimeout(() => {
      setInsets(getSafeAreaInsets())
    }, 100)

    // Update on resize (orientation change)
    const handleResize = () => {
      setInsets(getSafeAreaInsets())
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return insets
}

// ============================================================================
// useDeepLink - Deep link handling (see deep-links.ts for URL handling)
// ============================================================================

export interface DeepLinkState {
  /** The last received deep link URL */
  url: string | null
  /** Whether a deep link has been received */
  hasDeepLink: boolean
}

/**
 * Hook to handle deep links
 * Note: Use with deep-links.ts for URL parsing
 * @returns Deep link state
 */
export function useDeepLink(): DeepLinkState {
  const [state, setState] = useState<DeepLinkState>({
    url: null,
    hasDeepLink: false,
  })

  const listenerRef = useRef<PluginListenerHandle | null>(null)

  useEffect(() => {
    const setupListener = async () => {
      if (!isNative()) return

      try {
        const { App } = await import('@capacitor/app')

        // Check for initial URL (app opened via deep link)
        const { url } = await App.getLaunchUrl() || { url: null }
        if (url) {
          setState({ url, hasDeepLink: true })
        }

        // Listen for deep links while app is running
        listenerRef.current = await App.addListener('appUrlOpen', ({ url }) => {
          setState({ url, hasDeepLink: true })
        })
      } catch (error) {
        console.warn('Deep link setup failed:', error)
      }
    }

    setupListener()

    return () => {
      listenerRef.current?.remove()
    }
  }, [])

  return state
}

// ============================================================================
// useNativeNavigation - Combined navigation hook
// ============================================================================

export interface NativeNavigationOptions {
  /** Called when user wants to go back */
  onBack?: () => void
  /** Called when deep link is received */
  onDeepLink?: (url: string) => void
}

/**
 * Combined hook for native navigation features
 * Handles back button and deep links
 */
export function useNativeNavigation(options: NativeNavigationOptions = {}): void {
  const { onBack, onDeepLink } = options
  const deepLink = useDeepLink()

  // Handle back button
  useBackButton({
    onBack: onBack || (() => {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back()
      }
    }),
    enabled: !!onBack || true,
  })

  // Handle deep links
  useEffect(() => {
    if (deepLink.url && onDeepLink) {
      onDeepLink(deepLink.url)
    }
  }, [deepLink.url, onDeepLink])
}

// ============================================================================
// useNativeInit - Initialize native features
// ============================================================================

export interface NativeInitOptions {
  /** Hide splash screen when ready */
  hideSplash?: boolean
  /** Status bar style */
  statusBarStyle?: StatusBarStyle
  /** Status bar color (Android only) */
  statusBarColor?: string
}

/**
 * Hook to initialize native features on app startup
 * Call this in your root layout/app component
 */
export function useNativeInit(options: NativeInitOptions = {}): void {
  const {
    hideSplash = true,
    statusBarStyle = 'dark',
    statusBarColor = '#0f172a',
  } = options

  useEffect(() => {
    const init = async () => {
      // Apply safe area CSS variables
      applySafeAreaVariables()

      // Configure status bar
      await setStatusBarStyle(statusBarStyle)
      if (isAndroid()) {
        await setStatusBarColor(statusBarColor)
      }

      // Hide splash screen
      if (hideSplash) {
        await hideSplashScreen()
      }
    }

    init()
  }, [hideSplash, statusBarStyle, statusBarColor])
}
