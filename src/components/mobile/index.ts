/**
 * Mobile Components
 *
 * This module exports all mobile-specific components for the VivanceData PWA.
 * These components are optimized for touch devices and provide native-like UX.
 */

// Navigation
export { BottomNav, BottomNavSpacer } from './bottom-nav'
export { MobileHeader, MobileHeaderSpacer } from './mobile-header'

// Content
export { MobileLesson, MobileLessonOffline } from './mobile-lesson'
export { PullToRefresh, usePullToRefresh } from './pull-to-refresh'

// PWA
export { InstallPrompt, InstallButton } from './install-prompt'
export {
  OfflineIndicator,
  OfflineBanner,
  OfflineStatusDot,
  OfflineContent,
  useOnlineStatus
} from './offline-indicator'

// Provider
export {
  MobileProvider,
  useMobile,
  useIsMobile,
  useIsStandalone,
  useIsTouchDevice
} from './mobile-provider'
