'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface StreakDisplayProps {
  streak: number
  isActive?: boolean
  status?: 'active' | 'at_risk' | 'broken'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  onClick?: () => void
}

/**
 * StreakDisplay - Shows current streak with fire icon
 * Features animated fire icon and streak count
 * Tooltip with streak details available when used with Tooltip component
 */
export function StreakDisplay({
  streak,
  isActive = true,
  status = 'active',
  size = 'md',
  showLabel = false,
  className,
  onClick,
}: StreakDisplayProps) {
  const sizeConfig = {
    sm: {
      container: 'gap-1 px-2 py-1',
      icon: 'h-4 w-4',
      text: 'text-sm font-medium',
      label: 'text-xs',
    },
    md: {
      container: 'gap-1.5 px-3 py-1.5',
      icon: 'h-5 w-5',
      text: 'text-base font-semibold',
      label: 'text-xs',
    },
    lg: {
      container: 'gap-2 px-4 py-2',
      icon: 'h-6 w-6',
      text: 'text-xl font-bold',
      label: 'text-sm',
    },
  }

  const config = sizeConfig[size]

  const statusColors = {
    active: {
      container: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/50',
      icon: 'text-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
    },
    at_risk: {
      container: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50',
      icon: 'text-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
    broken: {
      container: 'bg-muted/50 border-muted-foreground/20',
      icon: 'text-muted-foreground',
      text: 'text-muted-foreground',
    },
  }

  const colors = statusColors[status]

  // Pulse animation for active streaks
  const shouldAnimate = isActive && status === 'active' && streak > 0

  const streakLabel = `Current streak: ${streak} day${streak !== 1 ? 's' : ''}`

  const content = (
    <>
      <span className="sr-only">{streakLabel}</span>
      <span
        className={cn(
          'relative',
          shouldAnimate && 'animate-pulse'
        )}
      >
        <Flame
          className={cn(
            config.icon,
            colors.icon,
            shouldAnimate && 'drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]'
          )}
          aria-hidden="true"
        />
      </span>
      <span className={cn(config.text, colors.text)} aria-hidden="true">
        {streak}
      </span>
      {showLabel && (
        <span className={cn(config.label, 'text-muted-foreground ml-0.5')} aria-hidden="true">
          {streak === 1 ? 'day' : 'days'}
        </span>
      )}
    </>
  )

  const baseClassName = cn(
    'inline-flex items-center rounded-full border',
    colors.container,
    config.container
  )

  // Without a click handler this is a status readout, not a control: render
  // it as plain text so it is not an inert focusable button.
  if (!onClick) {
    return <span className={cn(baseClassName, className)}>{content}</span>
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        baseClassName,
        'cursor-pointer transition-[transform,background-color,border-color,color] duration-200',
        'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        className
      )}
      type="button"
    >
      {content}
    </button>
  )
}

/**
 * StreakDisplaySkeleton - Loading state for streak display
 */
export function StreakDisplaySkeleton({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeConfig = {
    sm: 'w-16 h-6',
    md: 'w-20 h-8',
    lg: 'w-24 h-10',
  }

  return (
    <div
      className={cn(
        'rounded-full bg-muted animate-pulse',
        sizeConfig[size]
      )}
      role="status"
      aria-label="Loading streak…"
    />
  )
}

export default StreakDisplay
