'use client'

import { useEffect, useEffectEvent, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Clock, AlertTriangle } from 'lucide-react'

interface AssessmentTimerProps {
  /** Total time in minutes */
  timeLimit: number
  /** ISO string of when the assessment started */
  startedAt: string
  /** Callback when time runs out */
  onTimeUp: () => void
  /** Optional callback with remaining seconds for parent state sync */
  onTick?: (remainingSeconds: number) => void
  className?: string
}

/** Seconds left, derived from the wall clock so a throttled background tab cannot drift. */
function getRemainingSeconds(startedAt: string, timeLimit: number): number {
  const startTime = new Date(startedAt).getTime()
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
  return Math.max(0, timeLimit * 60 - elapsedSeconds)
}

export function AssessmentTimer({
  timeLimit,
  startedAt,
  onTimeUp,
  onTick,
  className,
}: AssessmentTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(startedAt, timeLimit)
  )
  const timeUpFiredRef = useRef(false)

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Parent callbacks run outside any setState updater, and onTimeUp fires once.
  const reportTick = useEffectEvent((seconds: number) => {
    if (seconds > 0) {
      onTick?.(seconds)
      return
    }
    if (!timeUpFiredRef.current) {
      timeUpFiredRef.current = true
      onTimeUp()
    }
  })

  useEffect(() => {
    if (getRemainingSeconds(startedAt, timeLimit) <= 0) {
      reportTick(0)
      return
    }

    const interval = setInterval(() => {
      const next = getRemainingSeconds(startedAt, timeLimit)
      setRemainingSeconds(next)
      reportTick(next)
      if (next <= 0) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt, timeLimit])

  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60 // 5 minutes
  const isCritical = remainingSeconds <= 60 // 1 minute

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors duration-300',
        !isWarning && !isCritical && 'bg-muted text-foreground',
        isWarning && !isCritical && 'bg-warning/20 text-warning border border-warning/50',
        isCritical && 'bg-destructive/20 text-destructive border border-destructive/50 animate-pulse',
        className
      )}
      role="timer"
      aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Clock className="h-5 w-5" aria-hidden="true" />
      )}
      <span className="tabular-nums">{formatTime(remainingSeconds)}</span>
      {/* Announces only when a threshold is crossed, not every second. */}
      <span className="sr-only" aria-live="polite">
        {isCritical
          ? 'Warning: Less than one minute remaining'
          : isWarning
            ? 'Less than five minutes remaining'
            : ''}
      </span>
    </div>
  )
}

interface AssessmentTimerCompactProps {
  /** Remaining time in seconds */
  remainingSeconds: number
  className?: string
}

export function AssessmentTimerCompact({
  remainingSeconds,
  className,
}: AssessmentTimerCompactProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const isCritical = remainingSeconds <= 60

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        isCritical && 'text-destructive font-bold',
        className
      )}
    >
      {formatTime(remainingSeconds)}
    </span>
  )
}
