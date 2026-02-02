'use client'

import { Badge } from '@/components/ui/badge'
import { Star, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelperBadgeProps {
  points: number
  showPoints?: boolean
  size?: 'sm' | 'default'
  className?: string
}

/**
 * Get the badge level based on points
 */
export function getHelperLevel(points: number): {
  level: 'none' | 'helper' | 'super'
  name: string
  minPoints: number
} {
  if (points >= 40) {
    return { level: 'super', name: 'Super Helper', minPoints: 40 }
  }
  if (points >= 10) {
    return { level: 'helper', name: 'Community Helper', minPoints: 10 }
  }
  return { level: 'none', name: '', minPoints: 0 }
}

export function HelperBadge({
  points,
  showPoints = true,
  size = 'default',
  className,
}: HelperBadgeProps) {
  const { level, name } = getHelperLevel(points)

  // Don't show badge if no helper level
  if (level === 'none') {
    if (showPoints && points > 0) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-muted-foreground',
            size === 'sm' ? 'text-xs' : 'text-sm',
            className
          )}
          title={`${points} community point${points !== 1 ? 's' : ''}`}
        >
          <Star className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          {points}
        </span>
      )
    }
    return null
  }

  if (level === 'super') {
    return (
      <Badge
        className={cn(
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1',
          size === 'sm' ? 'text-xs px-2 py-0' : '',
          className
        )}
        title={`${name} - ${points} community points`}
      >
        <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        {size === 'default' && <span>{name}</span>}
        {showPoints && <span>({points})</span>}
      </Badge>
    )
  }

  // Helper level (10+ points)
  return (
    <Badge
      className={cn(
        'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 gap-1',
        size === 'sm' ? 'text-xs px-2 py-0' : '',
        className
      )}
      title={`${name} - ${points} community points`}
    >
      <Star className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {size === 'default' && <span>{name}</span>}
      {showPoints && <span>({points})</span>}
    </Badge>
  )
}

/**
 * Inline point count display for user names
 */
export function PointsBadge({
  points,
  className,
}: {
  points: number
  className?: string
}) {
  if (points <= 0) return null

  const { level } = getHelperLevel(points)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs',
        level === 'super'
          ? 'text-amber-600 dark:text-amber-400'
          : level === 'helper'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-muted-foreground',
        className
      )}
      title={`${points} community point${points !== 1 ? 's' : ''}`}
    >
      {level === 'super' ? (
        <Sparkles className="h-3 w-3" />
      ) : (
        <Star className="h-3 w-3" />
      )}
      {points}
    </span>
  )
}
