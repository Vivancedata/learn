'use client'

import { useRef, useCallback, useEffect, useEffectEvent, useState } from 'react'

type SwipeDirection = 'left' | 'right' | 'up' | 'down'

interface SwipeConfig {
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  threshold?: number
  /** Maximum allowed deviation from the swipe direction in pixels (default: 100) */
  maxDeviation?: number
  /** Directions to detect (default: all directions) */
  directions?: SwipeDirection[]
  /** Whether to prevent default touch behavior (default: false) */
  preventDefault?: boolean
  /** Minimum velocity (pixels/ms) for a swipe to register (default: 0.3) */
  minVelocity?: number
}

interface SwipeState {
  /** Current swipe direction (if active) */
  direction: SwipeDirection | null
  /** Distance swiped in pixels */
  distance: number
  /** Velocity in pixels/ms */
  velocity: number
  /** Whether a swipe is currently in progress */
  isSwiping: boolean
  /** Progress of swipe relative to threshold (0-1) */
  progress: number
}

interface SwipeCallbacks {
  /** Called when swipe starts */
  onSwipeStart?: (direction: SwipeDirection) => void
  /** Called during swipe with current state */
  onSwipeMove?: (state: SwipeState) => void
  /** Called when swipe completes (passes threshold) */
  onSwipe?: (direction: SwipeDirection) => void
  /** Called when swipe is cancelled (doesn't meet threshold) */
  onSwipeCancel?: () => void
}

interface UseSwipeGestureReturn {
  /** Ref to attach to the swipeable element */
  ref: React.RefObject<HTMLDivElement | null>
  /** Current swipe state */
  state: SwipeState
  /** Reset swipe state */
  reset: () => void
}

const defaultConfig: Required<SwipeConfig> = {
  threshold: 50,
  maxDeviation: 100,
  directions: ['left', 'right', 'up', 'down'],
  preventDefault: false,
  minVelocity: 0.3
}

const IDLE_STATE: SwipeState = {
  direction: null,
  distance: 0,
  velocity: 0,
  isSwiping: false,
  progress: 0
}

function getSwipeDirection(deltaX: number, deltaY: number, maxDeviation: number): SwipeDirection | null {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)

  // Determine primary direction
  if (absX > absY) {
    // Horizontal swipe
    if (absY > maxDeviation) return null // Too much vertical deviation
    return deltaX > 0 ? 'right' : 'left'
  } else {
    // Vertical swipe
    if (absX > maxDeviation) return null // Too much horizontal deviation
    return deltaY > 0 ? 'down' : 'up'
  }
}

/**
 * Hook for detecting swipe gestures on touch devices
 *
 * @example
 * ```tsx
 * const { ref, state } = useSwipeGesture({
 *   onSwipe: (direction) => {
 *     if (direction === 'left') navigateToNext()
 *     if (direction === 'right') navigateToPrevious()
 *   }
 * })
 *
 * return <div ref={ref}>Swipe me!</div>
 * ```
 */
export function useSwipeGesture(
  callbacks: SwipeCallbacks = {},
  config: SwipeConfig = {}
): UseSwipeGestureReturn {
  const ref = useRef<HTMLDivElement>(null)

  const mergedConfig = { ...defaultConfig, ...config }
  const { threshold, maxDeviation, directions, preventDefault, minVelocity } = mergedConfig

  const [state, setState] = useState<SwipeState>(IDLE_STATE)

  // Touch start position and time
  const touchStart = useRef({ x: 0, y: 0, time: 0 })
  const isTracking = useRef(false)
  // The latest move, read synchronously at touchend (render state may lag a frame)
  const swipeRef = useRef<SwipeState>(IDLE_STATE)

  const reset = useCallback(() => {
    swipeRef.current = IDLE_STATE
    setState(IDLE_STATE)
    isTracking.current = false
  }, [])

  // Touch handlers are Effect Events: they always see the latest callbacks and
  // config, so the listeners below attach once instead of on every render
  // (callers pass inline callbacks/config, which change identity each render).
  const handleTouchStart = useEffectEvent((e: TouchEvent) => {
    if (!ref.current) return

    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    isTracking.current = true
    swipeRef.current = { ...IDLE_STATE, isSwiping: true }

    setState(prev => ({
      ...prev,
      isSwiping: true
    }))
  })

  const handleTouchMove = useEffectEvent((e: TouchEvent) => {
    if (!isTracking.current || !ref.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    const direction = getSwipeDirection(deltaX, deltaY, maxDeviation)

    // Check if direction is allowed
    if (direction && !directions.includes(direction)) {
      return
    }

    if (preventDefault && direction) {
      e.preventDefault()
    }

    // Calculate distance in the primary direction
    const distance = direction === 'left' || direction === 'right'
      ? Math.abs(deltaX)
      : Math.abs(deltaY)

    // Calculate velocity
    const elapsed = Date.now() - touchStart.current.time
    const velocity = elapsed > 0 ? distance / elapsed : 0

    // Calculate progress towards threshold
    const progress = Math.min(distance / threshold, 1)

    const newState: SwipeState = {
      direction,
      distance,
      velocity,
      isSwiping: true,
      progress
    }

    const previousDirection = swipeRef.current.direction
    swipeRef.current = newState
    setState(newState)

    // Notify about swipe movement
    if (callbacks.onSwipeMove) {
      callbacks.onSwipeMove(newState)
    }

    // Notify about swipe start (first detection of direction)
    if (direction && !previousDirection && callbacks.onSwipeStart) {
      callbacks.onSwipeStart(direction)
    }
  })

  const handleTouchEnd = useEffectEvent(() => {
    if (!isTracking.current) return
    isTracking.current = false

    const { direction, distance, velocity } = swipeRef.current

    // Check if swipe meets criteria
    const meetsThreshold = distance >= threshold
    const meetsVelocity = velocity >= minVelocity
    const isValidSwipe = direction && (meetsThreshold || meetsVelocity)

    if (isValidSwipe && direction) {
      // Successful swipe
      if (callbacks.onSwipe) {
        callbacks.onSwipe(direction)
      }

      // Haptic feedback on successful swipe
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
    } else {
      // Cancelled swipe
      if (callbacks.onSwipeCancel) {
        callbacks.onSwipeCancel()
      }
    }

    // Reset state
    reset()
  })

  const handleTouchCancel = useEffectEvent(() => {
    if (callbacks.onSwipeCancel) {
      callbacks.onSwipeCancel()
    }
    reset()
  })

  // Attach event listeners once per element (and when passive-ness changes)
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const onTouchStart = (e: TouchEvent) => handleTouchStart(e)
    const onTouchMove = (e: TouchEvent) => handleTouchMove(e)
    const onTouchEnd = () => handleTouchEnd()
    const onTouchCancel = () => handleTouchCancel()

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: !preventDefault })
    element.addEventListener('touchend', onTouchEnd, { passive: true })
    element.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
      element.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [preventDefault])

  return { ref, state, reset }
}

/**
 * Simplified hook for horizontal swipe navigation
 */
export function useHorizontalSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  config?: Omit<SwipeConfig, 'directions'>
) {
  return useSwipeGesture({
    onSwipe: (direction) => {
      if (direction === 'left' && onSwipeLeft) onSwipeLeft()
      if (direction === 'right' && onSwipeRight) onSwipeRight()
    }
  }, {
    ...config,
    directions: ['left', 'right']
  })
}

/**
 * Simplified hook for vertical swipe (e.g., to dismiss modals)
 */
export function useVerticalSwipe(
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  config?: Omit<SwipeConfig, 'directions'>
) {
  return useSwipeGesture({
    onSwipe: (direction) => {
      if (direction === 'up' && onSwipeUp) onSwipeUp()
      if (direction === 'down' && onSwipeDown) onSwipeDown()
    }
  }, {
    ...config,
    directions: ['up', 'down']
  })
}

/**
 * Hook for dismissible modals/drawers with swipe down
 */
export function useSwipeToDismiss(
  onDismiss: () => void,
  config?: Omit<SwipeConfig, 'directions'>
) {
  const [translateY, setTranslateY] = useState(0)

  const { ref, state, reset } = useSwipeGesture({
    onSwipeMove: (s) => {
      if (s.direction === 'down') {
        setTranslateY(s.distance)
      }
    },
    onSwipe: (direction) => {
      if (direction === 'down') {
        setTranslateY(0)
        onDismiss()
      }
    },
    onSwipeCancel: () => {
      setTranslateY(0)
    }
  }, {
    ...config,
    directions: ['down'],
    threshold: config?.threshold ?? 100
  })

  return {
    ref,
    translateY,
    progress: state.progress,
    reset: () => {
      setTranslateY(0)
      reset()
    }
  }
}
