'use client'

import { cn } from '@/lib/utils'
import { LeaderboardEntry, calculateRankChange } from '@/types/leaderboard'
import { Trophy, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]
  className?: string
}

function RankChangeIndicator({ currentRank, previousRank }: { currentRank: number; previousRank: number | null }) {
  const change = calculateRankChange(currentRank, previousRank)

  if (change.direction === 'new') {
    return (
      <span className="flex items-center gap-1 text-xs text-info">
        <Sparkles className="h-3 w-3" />
        New
      </span>
    )
  }

  if (change.direction === 'up') {
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <TrendingUp className="h-3 w-3" />
        +{change.amount}
      </span>
    )
  }

  if (change.direction === 'down') {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <TrendingDown className="h-3 w-3" />
        -{change.amount}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  )
}

function PodiumPlace({
  entry,
  position,
  isCurrentUser,
}: {
  entry: LeaderboardEntry | undefined
  position: 1 | 2 | 3
  isCurrentUser: boolean
}) {
  const heights = {
    1: 'h-32',
    2: 'h-24',
    3: 'h-20',
  }

  const colors = {
    1: 'from-amber-400 to-yellow-500 shadow-amber-400/30',
    2: 'from-slate-300 to-slate-400 shadow-slate-400/30',
    3: 'from-amber-600 to-amber-700 shadow-amber-600/30',
  }

  const borderColors = {
    1: 'ring-amber-400/50',
    2: 'ring-slate-400/50',
    3: 'ring-amber-600/50',
  }

  const trophyColors = {
    1: 'text-amber-400',
    2: 'text-slate-400',
    3: 'text-amber-600',
  }

  const initials = entry?.userName
    ? entry.userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  if (!entry) {
    return (
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground',
          'border-2 border-dashed border-muted-foreground/30'
        )}>
          <span className="text-lg font-semibold">?</span>
        </div>
        <div className={cn(
          'mt-4 w-20 rounded-t-lg bg-muted flex items-center justify-center',
          heights[position]
        )}>
          <span className="text-2xl font-bold text-muted-foreground">{position}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', position === 1 && '-mt-4')}>
      {/* Trophy for first place */}
      {position === 1 && (
        <Trophy className={cn('h-8 w-8 mb-2', trophyColors[1])} />
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold',
            'ring-4 shadow-lg transition-transform hover:scale-105',
            colors[position],
            borderColors[position],
            isCurrentUser && 'ring-primary'
          )}
        >
          <span className="text-lg">{initials}</span>
        </div>
        {/* Rank badge */}
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
            'bg-background border-2',
            position === 1 && 'border-amber-400 text-amber-600',
            position === 2 && 'border-slate-400 text-slate-600',
            position === 3 && 'border-amber-600 text-amber-700'
          )}
        >
          {position}
        </div>
      </div>

      {/* Name and score */}
      <div className="mt-3 text-center">
        <p className={cn(
          'font-semibold text-sm truncate max-w-20',
          isCurrentUser && 'text-primary'
        )}>
          {entry.userName || 'Anonymous'}
        </p>
        <p className="text-xs text-muted-foreground font-medium">
          {entry.score.toLocaleString()} XP
        </p>
        <RankChangeIndicator currentRank={entry.rank} previousRank={entry.previousRank} />
      </div>

      {/* Podium */}
      <div
        className={cn(
          'mt-4 w-20 rounded-t-lg bg-gradient-to-b flex items-center justify-center shadow-lg',
          heights[position],
          colors[position]
        )}
      >
        <span className="text-2xl font-bold text-white/90">{position}</span>
      </div>
    </div>
  )
}

export function LeaderboardPodium({ entries, className }: LeaderboardPodiumProps) {
  // Ensure we have entries for positions 1, 2, 3
  const first = entries.find(e => e.rank === 1)
  const second = entries.find(e => e.rank === 2)
  const third = entries.find(e => e.rank === 3)

  return (
    <div className={cn('flex items-end justify-center gap-4 py-8', className)}>
      {/* Second place - left */}
      <PodiumPlace
        entry={second}
        position={2}
        isCurrentUser={second?.isCurrentUser || false}
      />

      {/* First place - center */}
      <PodiumPlace
        entry={first}
        position={1}
        isCurrentUser={first?.isCurrentUser || false}
      />

      {/* Third place - right */}
      <PodiumPlace
        entry={third}
        position={3}
        isCurrentUser={third?.isCurrentUser || false}
      />
    </div>
  )
}
