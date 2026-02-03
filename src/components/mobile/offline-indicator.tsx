'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'

interface OfflineIndicatorProps {
  /** Position of the indicator */
  position?: 'top' | 'bottom'
  /** Whether to auto-hide when back online */
  autoHide?: boolean
  /** Auto-hide delay in ms (default: 3000) */
  autoHideDelay?: number
  /** Additional className */
  className?: string
}

type ConnectionState = 'online' | 'offline' | 'reconnected'

/**
 * Offline indicator component
 *
 * Features:
 * - Automatically detects online/offline status
 * - Shows reconnection notification
 * - Auto-dismisses after coming back online
 * - Accessible announcements for screen readers
 */
export function OfflineIndicator({
  position = 'top',
  autoHide = true,
  autoHideDelay = 3000,
  className
}: OfflineIndicatorProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('online')
  const [isVisible, setIsVisible] = useState(false)

  // Handle connection state changes
  const handleOnline = useCallback(() => {
    setConnectionState('reconnected')
    setIsVisible(true)

    if (autoHide) {
      setTimeout(() => {
        setIsVisible(false)
        setConnectionState('online')
      }, autoHideDelay)
    }
  }, [autoHide, autoHideDelay])

  const handleOffline = useCallback(() => {
    setConnectionState('offline')
    setIsVisible(true)
  }, [])

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check initial state
    if (!navigator.onLine) {
      setConnectionState('offline')
      setIsVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Don't render if online and not recently reconnected
  if (!isVisible) return null

  const isOffline = connectionState === 'offline'
  const isReconnected = connectionState === 'reconnected'

  return (
    <>
      {/* Visual indicator */}
      <div
        className={cn(
          'fixed left-0 right-0 z-50',
          'px-4 py-3',
          'animate-in fade-in duration-200',
          position === 'top' && 'top-0 slide-in-from-top',
          position === 'bottom' && 'bottom-0 slide-in-from-bottom',
          isOffline && 'bg-destructive text-destructive-foreground',
          isReconnected && 'bg-success text-success-foreground',
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="container flex items-center justify-center gap-2">
          {isOffline ? (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">
                You&apos;re offline. Some features may be unavailable.
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Back online!
              </span>
            </>
          )}
        </div>
      </div>

      {/* Safe area spacer for top position */}
      {position === 'top' && (
        <div className="h-12" aria-hidden="true" />
      )}
    </>
  )
}

/**
 * Hook to check online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Offline mode banner with cached content info
 */
export function OfflineBanner({
  cachedCourseCount = 0,
  onRefresh,
  className
}: {
  cachedCourseCount?: number
  onRefresh?: () => void
  className?: string
}) {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      className={cn(
        'rounded-lg border border-warning/50 bg-warning/10 p-4',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-warning/20">
          <WifiOff className="h-5 w-5 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-warning">Offline Mode</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;re currently offline.
            {cachedCourseCount > 0 && (
              <> You have {cachedCourseCount} course{cachedCourseCount !== 1 ? 's' : ''} available offline.</>
            )}
            {cachedCourseCount === 0 && (
              <> Some content may not be available until you reconnect.</>
            )}
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-3 text-sm font-medium text-warning hover:text-warning/80 flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try reconnecting
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Inline offline status indicator
 */
export function OfflineStatusDot({ className }: { className?: string }) {
  const isOnline = useOnlineStatus()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        className
      )}
      aria-label={isOnline ? 'Online' : 'Offline'}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-success' : 'bg-destructive animate-pulse'
        )}
      />
      <span className="text-xs text-muted-foreground">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </span>
  )
}

/**
 * Wrapper that shows offline placeholder for content
 */
export function OfflineContent({
  children,
  fallback,
  showFallbackWhenOffline = true
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  showFallbackWhenOffline?: boolean
}) {
  const isOnline = useOnlineStatus()

  if (!isOnline && showFallbackWhenOffline) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <WifiOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          This content is not available offline
        </p>
      </div>
    )
  }

  return <>{children}</>
}
