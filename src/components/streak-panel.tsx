'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StreakDisplay, StreakDisplaySkeleton } from './streak-display'
import { StreakCalendar, StreakCalendarSkeleton } from './streak-calendar'
import { StreakFreezeButton, StreakFreezeInfo } from './streak-freeze-button'
import { Trophy, Flame, TrendingUp } from 'lucide-react'

interface StreakData {
  userId: string
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  streakFreezes: number
  streakStatus: 'active' | 'at_risk' | 'broken'
  todayActive: boolean
  todayStats: {
    xpEarned: number
    lessonsCompleted: number
    quizzesTaken: number
    timeSpentMinutes: number
  } | null
  recentActivity: Array<{
    date: string
    xpEarned: number
    lessonsCompleted: number
    quizzesTaken: number
    timeSpentMinutes: number
  }>
}

interface StreakPanelProps {
  userId: string
  className?: string
  compact?: boolean
}

/**
 * StreakPanel - Full streak dashboard component
 * Shows current streak, calendar, and freeze options
 */
export function StreakPanel({
  userId,
  className,
  compact = false,
}: StreakPanelProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStreakData = useCallback(async () => {
    try {
      const response = await fetch(`/api/streaks/user/${userId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch streak data')
      }

      const result = await response.json()
      setStreakData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streak data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStreakData()
  }, [fetchStreakData])

  const handleUseFreeze = async () => {
    const response = await fetch('/api/streaks/freeze', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.message || 'Failed to use streak freeze')
    }

    // Refresh streak data after using freeze
    await fetchStreakData()
  }

  if (loading) {
    return <StreakPanelSkeleton compact={compact} className={className} />
  }

  if (error || !streakData) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <Flame className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{error || 'Unable to load streak data'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Daily Streak
            </CardTitle>
            <StreakDisplay
              streak={streakData.currentStreak}
              status={streakData.streakStatus}
              isActive={streakData.todayActive}
              size="md"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <StreakCalendar
            activities={streakData.recentActivity.map(a => ({
              ...a,
              date: new Date(a.date),
            }))}
            days={7}
            showHeader={false}
          />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Best: {streakData.longestStreak} days</span>
            </div>
            {streakData.streakFreezes > 0 && (
              <StreakFreezeButton
                freezesRemaining={streakData.streakFreezes}
                streakStatus={streakData.streakStatus}
                currentStreak={streakData.currentStreak}
                onUseFreeze={handleUseFreeze}
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main streak display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Your Learning Streak
          </CardTitle>
          <CardDescription>
            {streakData.streakStatus === 'active' && streakData.todayActive
              ? "Great job! You're on track today."
              : streakData.streakStatus === 'at_risk'
              ? 'Complete a lesson today to keep your streak!'
              : streakData.currentStreak === 0
              ? 'Start learning to build your streak!'
              : 'Your streak needs attention.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Streak stats */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <StreakDisplay
                  streak={streakData.currentStreak}
                  status={streakData.streakStatus}
                  isActive={streakData.todayActive}
                  size="lg"
                  showLabel
                />
                {streakData.currentStreak > 0 && streakData.currentStreak === streakData.longestStreak && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-400/50">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Personal Best!
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Longest Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{streakData.longestStreak} days</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Today&apos;s Progress</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {streakData.todayStats?.lessonsCompleted || 0}{' '}
                    <span className="text-sm font-normal text-muted-foreground">lessons</span>
                  </p>
                </div>
              </div>

              {/* Freeze info */}
              {streakData.streakFreezes > 0 && (
                <StreakFreezeInfo freezesRemaining={streakData.streakFreezes} />
              )}

              {/* Freeze button when needed */}
              {streakData.streakStatus === 'at_risk' && streakData.streakFreezes > 0 && (
                <StreakFreezeButton
                  freezesRemaining={streakData.streakFreezes}
                  streakStatus={streakData.streakStatus}
                  currentStreak={streakData.currentStreak}
                  onUseFreeze={handleUseFreeze}
                  className="w-full"
                />
              )}
            </div>

            {/* Calendar */}
            <div className="flex-1">
              <StreakCalendar
                activities={streakData.recentActivity.map(a => ({
                  ...a,
                  date: new Date(a.date),
                }))}
                days={7}
                showHeader={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * StreakPanelSkeleton - Loading state for streak panel
 */
export function StreakPanelSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <StreakDisplaySkeleton size="md" />
          </div>
        </CardHeader>
        <CardContent>
          <StreakCalendarSkeleton days={7} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <StreakDisplaySkeleton size="lg" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
                <div className="h-24 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <StreakCalendarSkeleton days={7} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StreakPanel
