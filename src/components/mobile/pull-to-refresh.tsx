'use client'

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type TouchEvent as ReactTouchEvent
} from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  /** Callback function when refresh is triggered */
  onRefresh: () => Promise<void>
  /** Content to wrap with pull-to-refresh */
  children: ReactNode
  /** Pull threshold in pixels before refresh triggers (default: 80) */
  threshold?: number
  /** Maximum pull distance in pixels (default: 120) */
  maxPullDistance?: number
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean
  /** Custom loading indicator */
  loadingIndicator?: ReactNode
  /** Custom pull indicator */
  pullIndicator?: ReactNode
  /** Additional className for the container */
  className?: string
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing'

/**
 * Pull-to-refresh component for mobile
 * Provides native-feeling pull-to-refresh functionality
 *
 * Features:
 * - Smooth spring animation
 * - Visual feedback during pull
 * - Haptic feedback when threshold is reached
 * - Prevents refresh on horizontal scrolling
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 120,
  enabled = true,
  loadingIndicator,
  pullIndicator,
  className
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<RefreshState>('idle')
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)
  const [startX, setStartX] = useState(0)
  const [isHorizontalScroll, setIsHorizontalScroll] = useState(false)

  // Calculate rotation based on pull distance
  const rotation = Math.min((pullDistance / threshold) * 180, 180)

  // Calculate scale based on pull distance
  const scale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1)

  // Calculate indicator opacity
  const opacity = Math.min(pullDistance / (threshold * 0.5), 1)

  // Handle touch start
  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    if (!enabled) return

    const touch = e.touches[0]
    setStartY(touch.clientY)
    setStartX(touch.clientX)
    setIsHorizontalScroll(false)

    // Only enable if scrolled to top
    const container = containerRef.current
    if (!container) return

    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop <= 0 && state === 'idle') {
      setState('idle')
    }
  }, [enabled, state])

  // Handle touch move
  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!enabled || state === 'refreshing') return

    const touch = e.touches[0]
    const deltaY = touch.clientY - startY
    const deltaX = touch.clientX - startX

    // Detect horizontal scroll
    if (!isHorizontalScroll && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsHorizontalScroll(true)
      return
    }

    if (isHorizontalScroll) return

    // Only pull down, and only when at top of scroll
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop > 0 || deltaY <= 0) {
      if (state !== 'idle') {
        setState('idle')
        setPullDistance(0)
      }
      return
    }

    // Prevent default to avoid bouncing
    if (deltaY > 0) {
      e.preventDefault()
    }

    // Apply resistance for more natural feel
    const resistance = 0.5
    const distance = Math.min(deltaY * resistance, maxPullDistance)

    setPullDistance(distance)

    // Update state based on distance
    if (distance >= threshold) {
      if (state !== 'ready') {
        setState('ready')
        // Haptic feedback when threshold is reached
        if ('vibrate' in navigator) {
          navigator.vibrate(10)
        }
      }
    } else if (distance > 0) {
      if (state !== 'pulling') {
        setState('pulling')
      }
    }
  }, [enabled, state, startY, startX, isHorizontalScroll, threshold, maxPullDistance])

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!enabled) return

    if (state === 'ready') {
      // Trigger refresh
      setState('refreshing')
      setPullDistance(threshold * 0.75) // Keep some distance while refreshing

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      }

      // Reset state
      setState('idle')
      setPullDistance(0)
    } else {
      // Spring back
      setState('idle')
      setPullDistance(0)
    }
  }, [enabled, state, threshold, onRefresh])

  // Reset on unmount
  useEffect(() => {
    return () => {
      setState('idle')
      setPullDistance(0)
    }
  }, [])

  // Default pull indicator
  const defaultPullIndicator = (
    <div
      className={cn(
        'flex items-center justify-center',
        'w-10 h-10 rounded-full',
        'bg-background border border-border shadow-md',
        'transition-all duration-200'
      )}
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
        opacity
      }}
    >
      <RefreshCw
        className={cn(
          'h-5 w-5 text-primary',
          state === 'refreshing' && 'animate-spin'
        )}
      />
    </div>
  )

  // Default loading indicator
  const defaultLoadingIndicator = (
    <div
      className={cn(
        'flex items-center justify-center',
        'w-10 h-10 rounded-full',
        'bg-background border border-border shadow-md'
      )}
    >
      <RefreshCw className="h-5 w-5 text-primary animate-spin" />
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-10',
          'transition-all duration-300 ease-out',
          state === 'idle' && pullDistance === 0 && 'opacity-0'
        )}
        style={{
          top: Math.max(pullDistance - 50, -50),
          transform: `translateX(-50%)`
        }}
        aria-hidden="true"
      >
        {state === 'refreshing'
          ? (loadingIndicator || defaultLoadingIndicator)
          : (pullIndicator || defaultPullIndicator)
        }
      </div>

      {/* Content wrapper with pull transform */}
      <div
        className={cn(
          'transition-transform',
          state === 'idle' && 'duration-300 ease-out',
          state !== 'idle' && 'duration-0'
        )}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none'
        }}
      >
        {children}
      </div>

      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {state === 'ready' && 'Release to refresh'}
        {state === 'refreshing' && 'Refreshing...'}
      </div>
    </div>
  )
}

/**
 * Hook to use pull-to-refresh functionality
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: Omit<PullToRefreshProps, 'onRefresh' | 'children'> = {}
) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  return {
    isRefreshing,
    refresh,
    PullToRefreshWrapper: ({ children }: { children: ReactNode }) => (
      <PullToRefresh onRefresh={refresh} {...options}>
        {children}
      </PullToRefresh>
    )
  }
}
