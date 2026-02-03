'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { LeaderboardPodium } from '@/components/leaderboard-podium'
import { LeaderboardTable } from '@/components/leaderboard-table'
import { LeaderboardUserCard } from '@/components/leaderboard-user-card'
import {
  LeaderboardResponse,
  LeaderboardType,
  LeaderboardPeriod,
  leaderboardTypeLabels,
  leaderboardPeriodLabels,
} from '@/types/leaderboard'
import {
  Trophy,
  Flame,
  BookOpen,
  GraduationCap,
  Heart,
  RefreshCw,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiResponse<T> {
  data: T
  timestamp: string
}

const typeIcons: Record<LeaderboardType, React.ReactNode> = {
  xp: <Trophy className="h-4 w-4" />,
  streaks: <Flame className="h-4 w-4" />,
  courses: <GraduationCap className="h-4 w-4" />,
  lessons: <BookOpen className="h-4 w-4" />,
  helping: <Heart className="h-4 w-4" />,
}

const periodOptions: LeaderboardPeriod[] = ['weekly', 'monthly', 'all_time']
const typeOptions: LeaderboardType[] = ['xp', 'streaks', 'courses', 'lessons', 'helping']

function LeaderboardContent() {
  const { user } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly')
  const [selectedType, setSelectedType] = useState<LeaderboardType>('xp')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeaderboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        type: selectedType,
        period: selectedPeriod,
        limit: '50',
      })

      const response = await fetch(`/api/leaderboards?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data')
      }

      const result: ApiResponse<LeaderboardResponse> = await response.json()
      setLeaderboardData(result.data)
    } catch (_err) {
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedPeriod, selectedType])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const handleRefresh = () => {
    fetchLeaderboard(true)
  }

  const totalParticipants = leaderboardData?.entries.length || 0

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">
            See how you rank against other learners
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* User's rank card */}
      {user && leaderboardData && (
        <LeaderboardUserCard
          userRank={leaderboardData.currentUserRank || leaderboardData.entries.find(e => e.isCurrentUser) || null}
          totalParticipants={totalParticipants}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Filter Leaderboard</CardTitle>
              <CardDescription>Choose time period and category</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{totalParticipants} participants</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time period tabs */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Time Period
            </label>
            <div className="flex flex-wrap gap-2">
              {periodOptions.map(period => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="min-w-20"
                >
                  {leaderboardPeriodLabels[period]}
                </Button>
              ))}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="gap-2"
                >
                  {typeIcons[type]}
                  <span className="hidden sm:inline">{leaderboardTypeLabels[type]}</span>
                  <span className="sm:hidden">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchLeaderboard()}>Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard content */}
      {!loading && !error && leaderboardData && (
        <div className="space-y-8">
          {/* Current filter badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {typeIcons[selectedType]}
              {leaderboardTypeLabels[selectedType]}
            </Badge>
            <Badge variant="outline">
              {leaderboardPeriodLabels[selectedPeriod]}
            </Badge>
            {leaderboardData.calculatedAt && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(leaderboardData.calculatedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Empty state */}
          {leaderboardData.entries.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
                <p className="text-muted-foreground">
                  Be the first to appear on the {leaderboardTypeLabels[selectedType].toLowerCase()} leaderboard!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Podium - Top 3 */}
          {leaderboardData.entries.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 via-slate-400/10 to-amber-600/10">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  The top 3 learners in {leaderboardTypeLabels[selectedType].toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <LeaderboardPodium entries={leaderboardData.entries} />
              </CardContent>
            </Card>
          )}

          {/* Full leaderboard table */}
          {leaderboardData.entries.length > 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Full Rankings
              </h2>
              <LeaderboardTable
                entries={leaderboardData.entries}
                startRank={4}
                maxHeight="500px"
              />
            </div>
          )}

          {/* Show current user if not in top 50 */}
          {leaderboardData.currentUserRank &&
            !leaderboardData.entries.some(e => e.isCurrentUser) && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Your Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary">
                        #{leaderboardData.currentUserRank.rank}
                      </span>
                      <span className="font-medium">
                        {leaderboardData.currentUserRank.userName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">
                        {leaderboardData.currentUserRank.score.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">XP</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Motivational footer */}
      <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2">Keep climbing the ranks!</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Complete lessons, maintain your streak, and help others in discussions to earn
            more XP and climb the leaderboard. Every bit of progress counts!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <LeaderboardContent />
    </ProtectedRoute>
  )
}
