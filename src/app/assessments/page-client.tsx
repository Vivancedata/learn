'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssessmentCard, AssessmentCardSkeleton } from '@/components/assessment-card'
import { useAuth } from '@/hooks/useAuth'
import {
  Target,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Trophy,
  BookOpen,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssessmentWithUserScore, CourseDifficulty } from '@/types/assessment'

interface AssessmentsResponse {
  data: {
    assessments: AssessmentWithUserScore[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    filters: {
      skillAreas: { name: string; count: number }[]
      difficulties: string[]
    }
  }
}

interface UserProfileResponse {
  data: {
    profile: {
      totalAssessments: number
      passedCount: number
      averageScore: number
    }
  }
}

interface AssessmentsCatalogState {
  assessments: AssessmentWithUserScore[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    skillAreas: { name: string; count: number }[]
    difficulties: string[]
  }
  userStats: {
    totalAssessments: number
    passedCount: number
    averageScore: number
  }
}

const initialAssessmentsCatalogState: AssessmentsCatalogState = {
  assessments: [],
  loading: true,
  error: null,
  pagination: {
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  },
  filters: {
    skillAreas: [],
    difficulties: ['Beginner', 'Intermediate', 'Advanced'],
  },
  userStats: {
    totalAssessments: 0,
    passedCount: 0,
    averageScore: 0,
  },
}

function subscribeToLocationChanges(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function useLocationSearch() {
  return useSyncExternalStore(
    subscribeToLocationChanges,
    () => window.location.search,
    () => ''
  )
}

function buildAssessmentQueryString(
  skillArea: string,
  difficulty: CourseDifficulty | '',
  page: number
): string {
  const params = new URLSearchParams()
  if (skillArea) {
    params.set('skillArea', skillArea)
  }
  if (difficulty) {
    params.set('difficulty', difficulty)
  }
  if (page > 1) {
    params.set('page', page.toString())
  }
  return params.toString()
}

function AssessmentsHeader({
  authLoading,
  user,
  userStats,
  signInHref,
}: {
  authLoading: boolean
  user: { id: string } | null
  userStats: AssessmentsCatalogState['userStats']
  signInHref: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-brand" />
            Skill Assessments
          </h1>
          <p className="text-muted-foreground mt-1">
            Test your knowledge and earn skill badges
          </p>
        </div>
      </div>

      {!authLoading && !user && (
        <Card className="border-brand/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Preview all assessments now. Sign in when you&apos;re ready to start attempts and
              track scores.
            </p>
            <Button asChild size="sm">
              <Link href={signInHref}>Sign In to Track Progress</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user ? userStats.totalAssessments : '—'}</p>
              <p className="text-sm text-muted-foreground">
                {user ? 'Assessments Taken' : 'Sign in to track attempts'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Trophy className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user ? userStats.passedCount : '—'}</p>
              <p className="text-sm text-muted-foreground">
                {user ? 'Assessments Passed' : 'Sign in to save results'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Award className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {user ? (userStats.averageScore > 0 ? `${userStats.averageScore}%` : '-') : '—'}
              </p>
              <p className="text-sm text-muted-foreground">
                {user ? 'Average Score' : 'Sign in to view stats'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AssessmentsFiltersPanel({
  filters,
  currentSkillArea,
  currentDifficulty,
  hasActiveFilters,
  updateFilters,
  clearFilters,
}: {
  filters: AssessmentsCatalogState['filters']
  currentSkillArea: string
  currentDifficulty: CourseDifficulty | ''
  hasActiveFilters: boolean
  updateFilters: (newFilters: { skillArea?: string; difficulty?: CourseDifficulty | ''; page?: number }) => void
  clearFilters: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Assessments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Category</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!currentSkillArea ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ skillArea: '' })}
              >
                All
              </Button>
              {filters.skillAreas.map((area) => (
                <Button
                  key={area.name}
                  variant={currentSkillArea === area.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ skillArea: area.name })}
                >
                  {area.name}
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {area.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!currentDifficulty ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilters({ difficulty: '' })}
              >
                All
              </Button>
              {filters.difficulties.map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={currentDifficulty === difficulty ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ difficulty: difficulty as CourseDifficulty })}
                  className={cn(
                    currentDifficulty === difficulty &&
                      difficulty === 'Beginner' &&
                      'bg-success hover:bg-success/90',
                    currentDifficulty === difficulty &&
                      difficulty === 'Intermediate' &&
                      'bg-warning hover:bg-warning/90',
                    currentDifficulty === difficulty &&
                      difficulty === 'Advanced' &&
                      'bg-destructive hover:bg-destructive/90'
                  )}
                >
                  {difficulty}
                </Button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AssessmentsResultsSection({
  loading,
  error,
  assessments,
  pagination,
  hasActiveFilters,
  user,
  onRetry,
  clearFilters,
  updateFilters,
}: {
  loading: boolean
  error: string | null
  assessments: AssessmentWithUserScore[]
  pagination: AssessmentsCatalogState['pagination']
  hasActiveFilters: boolean
  user: { id: string } | null
  onRetry: () => void
  clearFilters: () => void
  updateFilters: (newFilters: { skillArea?: string; difficulty?: CourseDifficulty | ''; page?: number }) => void
}) {
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={onRetry}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <AssessmentCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <>
      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No assessments found</p>
            <p className="text-muted-foreground">Try adjusting your filters to find assessments</p>
            {hasActiveFilters && (
              <Button className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              isAuthenticated={Boolean(user)}
            />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => updateFilters({ page: pagination.page - 1 })}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - pagination.page) <= 1
                )
              })
              .map((page, index, pages) => {
                const previousPage = pages[index - 1]
                const showEllipsis = previousPage && page - previousPage > 1

                return (
                  <span key={page} className="flex items-center gap-2">
                    {showEllipsis && <span className="text-muted-foreground">...</span>}
                    <Button
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      className="w-10"
                      onClick={() => updateFilters({ page })}
                    >
                      {page}
                    </Button>
                  </span>
                )
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => updateFilters({ page: pagination.page + 1 })}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </>
  )
}

function AssessmentsCatalogContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<AssessmentsCatalogState>(initialAssessmentsCatalogState)
  const locationSearch = useLocationSearch()
  const searchParams = new URLSearchParams(locationSearch)

  const {
    assessments,
    loading,
    error,
    pagination,
    filters,
    userStats,
  } = state
  const currentSkillArea = searchParams.get('skillArea') || ''
  const currentDifficulty = (searchParams.get('difficulty') || '') as CourseDifficulty | ''
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10)

  const fetchAssessments = useCallback(async () => {
    setState((previousState) => ({
      ...previousState,
      loading: true,
      error: null,
    }))

    try {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', '9')
      if (currentSkillArea) {
        params.set('skillArea', currentSkillArea)
      }
      if (currentDifficulty) {
        params.set('difficulty', currentDifficulty)
      }

      const response = await fetch(`/api/assessments?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch assessments')
      }

      const data: AssessmentsResponse = await response.json()
      setState((previousState) => ({
        ...previousState,
        assessments: data.data.assessments,
        pagination: data.data.pagination,
        filters: data.data.filters,
        loading: false,
      }))
    } catch (_error) {
      setState((previousState) => ({
        ...previousState,
        error: 'Failed to load assessments. Please try again.',
        loading: false,
      }))
    }
  }, [currentDifficulty, currentPage, currentSkillArea])

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) {
      return
    }

    try {
      const response = await fetch(`/api/assessments/user/${user.id}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data: UserProfileResponse = await response.json()
        setState((previousState) => ({
          ...previousState,
          userStats: data.data.profile,
        }))
      }
    } catch (_error) {
      // User stats are optional - non-critical failure.
    }
  }, [user?.id])

  useEffect(() => {
    void fetchAssessments()
  }, [fetchAssessments])

  useEffect(() => {
    void fetchUserStats()
  }, [fetchUserStats])

  const updateFilters = (newFilters: {
    skillArea?: string
    difficulty?: CourseDifficulty | ''
    page?: number
  }) => {
    const nextSkillArea =
      newFilters.skillArea !== undefined ? newFilters.skillArea : currentSkillArea
    const nextDifficulty =
      newFilters.difficulty !== undefined ? newFilters.difficulty : currentDifficulty
    const nextPage =
      newFilters.page !== undefined
        ? newFilters.page
        : newFilters.skillArea !== undefined || newFilters.difficulty !== undefined
          ? 1
          : currentPage

    const queryString = buildAssessmentQueryString(nextSkillArea, nextDifficulty, nextPage)
    router.push(queryString ? `/assessments?${queryString}` : '/assessments')
  }

  const clearFilters = () => {
    router.push('/assessments')
  }

  const hasActiveFilters = Boolean(currentSkillArea || currentDifficulty)
  const signInHref = `/sign-in?redirect=${encodeURIComponent('/assessments')}`

  return (
    <div className="space-y-8">
      <AssessmentsHeader
        authLoading={authLoading}
        user={user}
        userStats={userStats}
        signInHref={signInHref}
      />
      <AssessmentsFiltersPanel
        filters={filters}
        currentSkillArea={currentSkillArea}
        currentDifficulty={currentDifficulty}
        hasActiveFilters={hasActiveFilters}
        updateFilters={updateFilters}
        clearFilters={clearFilters}
      />
      <AssessmentsResultsSection
        loading={loading}
        error={error}
        assessments={assessments}
        pagination={pagination}
        hasActiveFilters={hasActiveFilters}
        user={user}
        onRetry={() => void fetchAssessments()}
        clearFilters={clearFilters}
        updateFilters={updateFilters}
      />
    </div>
  )
}

export default function AssessmentsCatalogPage() {
  return <AssessmentsCatalogContent />
}
