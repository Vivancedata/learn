'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { BottomNav, BottomNavSpacer } from './bottom-nav'
import { OfflineIndicator } from './offline-indicator'
import { InstallPrompt } from './install-prompt'

interface MobileContextValue {
  /** Whether the device is mobile (screen width < 768px) */
  isMobile: boolean
  /** Whether the device is a touch device */
  isTouchDevice: boolean
  /** Whether the app is in standalone mode (installed PWA) */
  isStandalone: boolean
  /** Whether the device is iOS */
  isIOS: boolean
  /** Whether the device is Android */
  isAndroid: boolean
}

const MobileContext = createContext<MobileContextValue>({
  isMobile: false,
  isTouchDevice: false,
  isStandalone: false,
  isIOS: false,
  isAndroid: false
})

export function useMobile() {
  return useContext(MobileContext)
}

interface MobileProviderProps {
  children: ReactNode
  /** Whether to show the bottom navigation (default: true) */
  showBottomNav?: boolean
  /** Whether to show the offline indicator (default: true) */
  showOfflineIndicator?: boolean
  /** Whether to show the install prompt (default: true on mobile) */
  showInstallPrompt?: boolean
  /** Minimum visits before showing install prompt (default: 2) */
  installPromptMinVisits?: number
  /** Number of unread notifications for badge */
  notificationCount?: number
}

/**
 * Mobile Provider Component
 *
 * Wraps the application with mobile-specific features:
 * - Mobile detection context
 * - Bottom navigation
 * - Offline indicator
 * - PWA install prompt
 *
 * @example
 * ```tsx
 * <MobileProvider showBottomNav={true}>
 *   <App />
 * </MobileProvider>
 * ```
 */
export function MobileProvider({
  children,
  showBottomNav = true,
  showOfflineIndicator = true,
  showInstallPrompt = true,
  installPromptMinVisits = 2,
  notificationCount = 0
}: MobileProviderProps) {
  const [mobileState, setMobileState] = useState<MobileContextValue>({
    isMobile: false,
    isTouchDevice: false,
    isStandalone: false,
    isIOS: false,
    isAndroid: false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ua = navigator.userAgent.toLowerCase()

    // Mobile = below the md breakpoint (768px). A media query only fires when
    // the boolean flips, unlike `resize`, which fires on every pixel.
    const mobileQuery = window.matchMedia('(max-width: 767px)')

    // Check if touch device
    const checkTouch = () => {
      return 'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE-specific
        navigator.msMaxTouchPoints > 0
    }

    // Check if standalone (installed PWA)
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-expect-error - standalone is iOS-specific
        window.navigator.standalone === true
    }

    // Initial state
    setMobileState({
      isMobile: mobileQuery.matches,
      isTouchDevice: checkTouch(),
      isStandalone: checkStandalone(),
      isIOS: /iphone|ipad|ipod/.test(ua),
      isAndroid: /android/.test(ua)
    })

    // Listen for crossing the mobile breakpoint
    const handleMobileChange = (e: MediaQueryListEvent) => {
      setMobileState(prev => ({
        ...prev,
        isMobile: e.matches
      }))
    }
    mobileQuery.addEventListener('change', handleMobileChange)

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setMobileState(prev => ({
        ...prev,
        isStandalone: e.matches
      }))
    }
    mediaQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      mobileQuery.removeEventListener('change', handleMobileChange)
      mediaQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  return (
    <MobileContext.Provider value={mobileState}>
      {/* Offline indicator at top */}
      {showOfflineIndicator && (
        <OfflineIndicator position="top" autoHide autoHideDelay={3000} />
      )}

      {/* Main content */}
      {children}

      {/* Bottom navigation spacer (prevents content from being hidden) */}
      {showBottomNav && <BottomNavSpacer />}

      {/* Bottom navigation */}
      {showBottomNav && (
        <BottomNav notificationCount={notificationCount} />
      )}

      {/* Install prompt (mobile only) */}
      {showInstallPrompt && mobileState.isMobile && (
        <InstallPrompt minVisits={installPromptMinVisits} />
      )}
    </MobileContext.Provider>
  )
}

/**
 * Hook to detect if running on mobile
 */
export function useIsMobile(): boolean {
  const { isMobile } = useMobile()
  return isMobile
}

/**
 * Hook to detect if running as installed PWA
 */
export function useIsStandalone(): boolean {
  const { isStandalone } = useMobile()
  return isStandalone
}

/**
 * Hook to detect if device is touch-enabled
 */
export function useIsTouchDevice(): boolean {
  const { isTouchDevice } = useMobile()
  return isTouchDevice
}
