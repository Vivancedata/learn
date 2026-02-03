'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { LeaderboardEntry, calculateRankChange } from '@/types/leaderboard'
import { Trophy, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react'

interface LeaderboardUserCardProps {
  userRank: LeaderboardEntry | null
  totalParticipants: number
  className?: string
}

export function LeaderboardUserCard({
  userRank,
  totalParticipants,
  className,
}: LeaderboardUserCardProps) {
  if (!userRank) {
    return (
      <Card className={cn('bg-gradient-to-br from-muted/50 to-muted', className)}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Complete lessons to appear on the leaderboard!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const change = calculateRankChange(userRank.rank, userRank.previousRank)
  const percentile = Math.round(((totalParticipants - userRank.rank + 1) / totalParticipants) * 100)
  const xpToNextRank = userRank.rank > 1 ? Math.ceil(userRank.score * 0.1) : 0

  const initials = userRank.userName
    ? userRank.userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <Card className={cn(
      'bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20',
      'overflow-hidden relative',
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

      <CardContent className="p-6 relative">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar and rank */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {initials}
              </div>
              {userRank.rank <= 3 && (
                <div className={cn(
                  'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center',
                  userRank.rank === 1 && 'bg-amber-400 text-amber-900',
                  userRank.rank === 2 && 'bg-slate-300 text-slate-700',
                  userRank.rank === 3 && 'bg-amber-600 text-amber-100'
                )}>
                  <Trophy className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <p className="font-semibold">{userRank.userName || 'Anonymous'}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Rank */}
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-primary">
                <span>#{userRank.rank}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {totalParticipants.toLocaleString()} learners
              </p>
            </div>

            {/* XP */}
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Zap className="h-5 w-5 text-amber-500" />
                <span>{userRank.score.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total XP</p>
            </div>

            {/* Percentile */}
            <div className="text-center p-3 rounded-lg bg-background/50 col-span-2 sm:col-span-1">
              <div className="text-2xl font-bold text-success">
                Top {percentile}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Percentile</p>
            </div>
          </div>
        </div>

        {/* Rank change and next target */}
        <div className="mt-4 pt-4 border-t border-primary/10 flex flex-wrap items-center justify-between gap-4">
          {/* Rank change */}
          <div className="flex items-center gap-2">
            {change.direction === 'up' && (
              <>
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-success font-medium">
                  Up {change.amount} {change.amount === 1 ? 'place' : 'places'} this period
                </span>
              </>
            )}
            {change.direction === 'down' && (
              <>
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  Down {change.amount} {change.amount === 1 ? 'place' : 'places'} this period
                </span>
              </>
            )}
            {change.direction === 'same' && (
              <span className="text-sm text-muted-foreground">
                Holding steady
              </span>
            )}
            {change.direction === 'new' && (
              <span className="text-sm text-info font-medium">
                New entry on the leaderboard!
              </span>
            )}
          </div>

          {/* Next rank target */}
          {userRank.rank > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>~{xpToNextRank.toLocaleString()} XP to next rank</span>
            </div>
          )}
          {userRank.rank === 1 && (
            <div className="flex items-center gap-2 text-sm text-amber-500 font-medium">
              <Trophy className="h-4 w-4" />
              <span>You are the leader!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
