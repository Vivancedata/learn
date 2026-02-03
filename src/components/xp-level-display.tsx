'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Zap, Trophy, TrendingUp, Shield, Crown, Gem } from 'lucide-react'

interface XpData {
  totalXp: number
  level: number
  levelName: string
  xpToNextLevel: number
  levelProgress: number
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  tierConfig: {
    name: string
    color: string
    bgColor: string
    borderColor: string
    icon: string
  }
  recentTransactions?: Array<{
    id: string
    amount: number
    source: string
    description: string
    createdAt: string
  }>
}

interface XpLevelDisplayProps {
  userId: string
  className?: string
  variant?: 'full' | 'compact' | 'minimal'
  showTransactions?: boolean
}

/**
 * XpLevelDisplay - Shows user XP, level, and progress
 * Features different variants for various display contexts
 */
export function XpLevelDisplay({
  userId,
  className,
  variant = 'full',
  showTransactions = false,
}: XpLevelDisplayProps) {
  const [xpData, setXpData] = useState<XpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchXpData = useCallback(async () => {
    try {
      const response = await fetch(`/api/xp/user/${userId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch XP data')
      }

      const result = await response.json()
      setXpData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load XP data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchXpData()
  }, [fetchXpData])

  // Get tier icon component
  const TierIcon = ({ tier }: { tier: string }) => {
    switch (tier) {
      case 'gold':
        return <Crown className="h-4 w-4" />
      case 'diamond':
        return <Gem className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  if (loading) {
    return <XpLevelDisplaySkeleton variant={variant} className={className} />
  }

  if (error || !xpData) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{error || 'Unable to load XP data'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Minimal variant - just XP and level badge
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
          xpData.tierConfig.bgColor,
          xpData.tierConfig.borderColor
        )}>
          <Zap className={cn('h-4 w-4', xpData.tierConfig.color)} />
          <span className={cn('font-semibold', xpData.tierConfig.color)}>
            {xpData.totalXp.toLocaleString()} XP
          </span>
        </div>
        <Badge variant="outline" className={cn(
          xpData.tierConfig.color,
          xpData.tierConfig.bgColor,
          xpData.tierConfig.borderColor
        )}>
          <TierIcon tier={xpData.tier} />
          <span className="ml-1">Lvl {xpData.level}</span>
        </Badge>
      </div>
    )
  }

  // Compact variant - card with basic info
  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Experience
            </CardTitle>
            <Badge className={cn(
              'gap-1',
              xpData.tierConfig.bgColor,
              xpData.tierConfig.color,
              xpData.tierConfig.borderColor
            )}>
              <TierIcon tier={xpData.tier} />
              Level {xpData.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* XP Total */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {xpData.totalXp.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </div>

          {/* Progress to next level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{xpData.levelName}</span>
              <span className="font-medium">{xpData.levelProgress}%</span>
            </div>
            <Progress value={xpData.levelProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {xpData.xpToNextLevel.toLocaleString()} XP to Level {xpData.level + 1}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant - complete display with optional transactions
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Experience Points
        </CardTitle>
        <CardDescription>
          Track your learning progress and level up
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level and XP display */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Level badge */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
            <div className={cn(
              'flex items-center justify-center w-16 h-16 rounded-full border-4 mb-2',
              xpData.tierConfig.bgColor,
              xpData.tierConfig.borderColor
            )}>
              <span className={cn('text-2xl font-bold', xpData.tierConfig.color)}>
                {xpData.level}
              </span>
            </div>
            <Badge className={cn(
              'gap-1',
              xpData.tierConfig.bgColor,
              xpData.tierConfig.color,
              'border',
              xpData.tierConfig.borderColor
            )}>
              <TierIcon tier={xpData.tier} />
              {xpData.tierConfig.name}
            </Badge>
            <p className="text-sm font-medium mt-2">{xpData.levelName}</p>
          </div>

          {/* XP stats */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Total XP</span>
                </div>
                <p className="text-2xl font-bold">{xpData.totalXp.toLocaleString()}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">To Next Level</span>
                </div>
                <p className="text-2xl font-bold">{xpData.xpToNextLevel.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Level {xpData.level}</span>
                <span className="font-medium">{xpData.levelProgress}%</span>
                <span className="text-muted-foreground">Level {xpData.level + 1}</span>
              </div>
              <Progress value={xpData.levelProgress} className="h-3" />
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        {showTransactions && xpData.recentTransactions && xpData.recentTransactions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Recent XP
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {xpData.recentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                >
                  <span className="text-muted-foreground">{transaction.description}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    +{transaction.amount} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * XpLevelDisplaySkeleton - Loading state for XP display
 */
export function XpLevelDisplaySkeleton({
  variant = 'full',
  className,
}: {
  variant?: 'full' | 'compact' | 'minimal'
  className?: string
}) {
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />
        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="h-8 w-24 bg-muted rounded mx-auto animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded mx-auto mt-2 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded mx-auto animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col items-center p-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="h-6 w-20 bg-muted rounded mt-2 animate-pulse" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="h-3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default XpLevelDisplay
