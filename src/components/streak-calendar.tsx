'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface DayActivity {
  date: Date | string
  xpEarned: number
  lessonsCompleted: number
  quizzesTaken: number
  timeSpentMinutes: number
  isFreezeDay?: boolean
}

// Hoisted: one formatter for every cell, in the viewer's own locale.
const DAY_LABEL_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

interface StreakCalendarProps {
  activities: DayActivity[]
  days?: 7 | 14 | 30
  className?: string
  showHeader?: boolean
  title?: string
  description?: string
}

/**
 * StreakCalendar - Visual calendar showing activity history
 * - Green = active day with activity
 * - Gray = inactive day (no activity)
 * - Blue = freeze used to protect streak
 * Per-day details are read out to screen readers (visually: colour only)
 */
export function StreakCalendar({
  activities,
  days = 7,
  className,
  showHeader = true,
  title = 'Activity Calendar',
  description = 'Your learning activity over time',
}: StreakCalendarProps) {
  // Generate array of dates for the calendar
  const dateRange = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date)
    }

    return dates
  }, [days])

  // Create a map of activities by date string for quick lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>()
    activities.forEach(activity => {
      const date = new Date(activity.date)
      date.setHours(0, 0, 0, 0)
      const key = date.toISOString().split('T')[0]
      map.set(key, activity)
    })
    return map
  }, [activities])

  // Get day of week abbreviations
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  // Computed once per render rather than once per cell
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()

  // Get activity status and styling for a given date
  const getDayStatus = (date: Date) => {
    const key = date.toISOString().split('T')[0]
    const activity = activityMap.get(key)

    const isToday = date.getTime() === todayTime
    const isFuture = date.getTime() > todayTime

    if (isFuture) {
      return {
        status: 'future' as const,
        activity: null,
        className: 'bg-muted/30 border-dashed border-muted-foreground/20',
      }
    }

    if (activity) {
      // Check if it's a freeze day (no actual activity, but streak preserved)
      const hasActivity =
        activity.lessonsCompleted > 0 ||
        activity.quizzesTaken > 0 ||
        activity.timeSpentMinutes > 0 ||
        activity.xpEarned > 0

      if (activity.isFreezeDay || !hasActivity) {
        return {
          status: 'freeze' as const,
          activity,
          className: cn(
            'bg-blue-500/20 border-blue-400/50',
            'hover:bg-blue-500/30 focus:bg-blue-500/30',
            isToday && 'ring-2 ring-blue-500/50'
          ),
        }
      }

      // Calculate intensity based on activity level
      const intensity = Math.min(
        100,
        (activity.lessonsCompleted * 20) +
        (activity.quizzesTaken * 15) +
        Math.floor(activity.timeSpentMinutes / 10) * 5
      )

      return {
        status: 'active' as const,
        activity,
        className: cn(
          intensity > 60
            ? 'bg-green-500/40 border-green-400/60'
            : intensity > 30
            ? 'bg-green-500/30 border-green-400/50'
            : 'bg-green-500/20 border-green-400/40',
          'hover:bg-green-500/50 focus:bg-green-500/50',
          isToday && 'ring-2 ring-green-500/50'
        ),
      }
    }

    return {
      status: 'inactive' as const,
      activity: null,
      className: cn(
        'bg-muted/50 border-muted-foreground/20',
        isToday && 'ring-2 ring-muted-foreground/30'
      ),
    }
  }

  const content = (
    <div className={cn('space-y-4', !showHeader && className)}>
      {/* Week day labels for 7-day view */}
      {days === 7 && (
        <div className="flex justify-between px-1">
          {dateRange.map((date, index) => (
            <span
              key={index}
              className="text-xs text-muted-foreground font-medium w-10 text-center"
            >
              {dayLabels[date.getDay()]}
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div
        className={cn(
          'grid gap-1.5',
          days === 7 && 'grid-cols-7',
          days === 14 && 'grid-cols-7',
          days === 30 && 'grid-cols-7'
        )}
        role="list"
        aria-label="Activity calendar"
      >
        {dateRange.map((date, index) => {
          const { status, activity, className: dayClassName } = getDayStatus(date)
          const description =
            status === 'active' && activity
              ? `${activity.lessonsCompleted} lessons, ${activity.quizzesTaken} quizzes, ${activity.xpEarned} XP, ${activity.timeSpentMinutes} minutes`
              : status === 'freeze'
                ? 'Streak freeze used'
                : status === 'future'
                  ? 'Future date'
                  : 'No activity'

          return (
            <div
              key={index}
              className={cn(
                'relative aspect-square rounded-lg border transition-colors duration-200',
                'flex items-center justify-center cursor-default',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
                dayClassName
              )}
              role="listitem"
            >
              {/* Day number (the full description below is what gets read) */}
              <span
                aria-hidden="true"
                className={cn(
                  'text-xs font-medium',
                  status === 'active' && 'text-green-700 dark:text-green-300',
                  status === 'freeze' && 'text-blue-700 dark:text-blue-300',
                  status === 'inactive' && 'text-muted-foreground',
                  status === 'future' && 'text-muted-foreground/50'
                )}
              >
                {date.getDate()}
              </span>

              <span className="sr-only">
                {`${DAY_LABEL_FORMAT.format(date)}: ${description}`}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/30 border border-green-400/50" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-400/50" />
          <span>Freeze</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted/50 border border-muted-foreground/20" />
          <span>Inactive</span>
        </div>
      </div>
    </div>
  )

  if (showHeader) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return content
}

/**
 * StreakCalendarSkeleton - Loading state for streak calendar
 */
export function StreakCalendarSkeleton({
  days = 7,
}: {
  days?: 7 | 14 | 30
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'grid gap-1.5',
            days === 7 && 'grid-cols-7'
          )}
        >
          {Array.from({ length: days }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default StreakCalendar
