'use client'

import { useEffect, useState, useCallback } from 'react'
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

export function AssessmentTimer({
  timeLimit,
  startedAt,
  onTimeUp,
  onTick,
  className,
}: AssessmentTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const startTime = new Date(startedAt).getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - startTime) / 1000)
    const totalSeconds = timeLimit * 60
    return Math.max(0, totalSeconds - elapsedSeconds)
  })

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onTimeUp()
      return
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = prev - 1
        if (newValue <= 0) {
          onTimeUp()
          return 0
        }
        onTick?.(newValue)
        return newValue
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingSeconds, onTimeUp, onTick])

  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60 // 5 minutes
  const isCritical = remainingSeconds <= 60 // 1 minute

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-all duration-300',
        !isWarning && !isCritical && 'bg-muted text-foreground',
        isWarning && !isCritical && 'bg-warning/20 text-warning border border-warning/50',
        isCritical && 'bg-destructive/20 text-destructive border border-destructive/50 animate-pulse',
        className
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Clock className="h-5 w-5" aria-hidden="true" />
      )}
      <span className="tabular-nums">{formatTime(remainingSeconds)}</span>
      {isCritical && (
        <span className="sr-only">Warning: Less than one minute remaining</span>
      )}
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
