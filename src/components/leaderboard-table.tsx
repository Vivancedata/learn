'use client'

import { cn } from '@/lib/utils'
import { LeaderboardEntry, calculateRankChange } from '@/types/leaderboard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingUp, TrendingDown, Minus, Sparkles, Flame } from 'lucide-react'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  startRank?: number
  className?: string
  maxHeight?: string
}

function RankChangeIndicator({ currentRank, previousRank }: { currentRank: number; previousRank: number | null }) {
  const change = calculateRankChange(currentRank, previousRank)

  if (change.direction === 'new') {
    return (
      <span className="flex items-center gap-1 text-xs text-info" title="New entry">
        <Sparkles className="h-3 w-3" />
      </span>
    )
  }

  if (change.direction === 'up') {
    return (
      <span className="flex items-center gap-1 text-xs text-success" title={`Up ${change.amount} places`}>
        <TrendingUp className="h-3 w-3" />
        <span className="hidden sm:inline">{change.amount}</span>
      </span>
    )
  }

  if (change.direction === 'down') {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive" title={`Down ${change.amount} places`}>
        <TrendingDown className="h-3 w-3" />
        <span className="hidden sm:inline">{change.amount}</span>
      </span>
    )
  }

  return (
    <span className="flex items-center text-muted-foreground" title="No change">
      <Minus className="h-3 w-3" />
    </span>
  )
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const initials = entry.userName
    ? entry.userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const isTopTen = entry.rank <= 10

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
        'hover:bg-accent/50',
        entry.isCurrentUser && 'bg-primary/10 hover:bg-primary/15 ring-1 ring-primary/30',
        index % 2 === 0 ? 'bg-muted/30' : ''
      )}
    >
      {/* Rank */}
      <div className="w-12 flex items-center gap-2">
        <span
          className={cn(
            'font-bold',
            isTopTen ? 'text-primary' : 'text-muted-foreground',
            entry.rank <= 3 && 'text-lg'
          )}
        >
          #{entry.rank}
        </span>
      </div>

      {/* Rank change */}
      <div className="w-8">
        <RankChangeIndicator currentRank={entry.rank} previousRank={entry.previousRank} />
      </div>

      {/* Avatar */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
          'bg-gradient-to-br from-primary/20 to-accent/20 text-foreground',
          entry.isCurrentUser && 'from-primary/40 to-accent/40'
        )}
      >
        {initials}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          entry.isCurrentUser && 'text-primary font-semibold'
        )}>
          {entry.userName || 'Anonymous'}
          {entry.isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
        </p>
      </div>

      {/* Streak indicator if present */}
      {entry.metadata?.streakDays && entry.metadata.streakDays > 0 && (
        <div className="flex items-center gap-1 text-orange-500" title={`${entry.metadata.streakDays} day streak`}>
          <Flame className="h-4 w-4" />
          <span className="text-sm font-medium">{entry.metadata.streakDays}</span>
        </div>
      )}

      {/* Score */}
      <div className="text-right">
        <span className={cn(
          'font-semibold tabular-nums',
          isTopTen ? 'text-primary' : 'text-foreground'
        )}>
          {entry.score.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground ml-1">XP</span>
      </div>
    </div>
  )
}

export function LeaderboardTable({
  entries,
  startRank = 4,
  className,
  maxHeight = '400px',
}: LeaderboardTableProps) {
  // Filter entries starting from the specified rank
  const filteredEntries = entries.filter(e => e.rank >= startRank)

  if (filteredEntries.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p>No more entries to display</p>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
        <div className="w-12">Rank</div>
        <div className="w-8"></div>
        <div className="w-10"></div>
        <div className="flex-1">Name</div>
        <div className="text-right">Score</div>
      </div>

      {/* Scrollable content */}
      <ScrollArea style={{ height: maxHeight }}>
        <div className="divide-y divide-border/50">
          {filteredEntries.map((entry, index) => (
            <LeaderboardRow key={entry.id || entry.userId} entry={entry} index={index} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
