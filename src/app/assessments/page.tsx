'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssessmentCard, AssessmentCardSkeleton } from '@/components/assessment-card'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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

function AssessmentsCatalogContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [assessments, setAssessments] = useState<AssessmentWithUserScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState<{
    skillAreas: { name: string; count: number }[]
    difficulties: string[]
  }>({
    skillAreas: [],
    difficulties: ['Beginner', 'Intermediate', 'Advanced'],
  })
  const [userStats, setUserStats] = useState({
    totalAssessments: 0,
    passedCount: 0,
    averageScore: 0,
  })

  // Current filter values from URL
  const currentSkillArea = searchParams.get('skillArea') || ''
  const currentDifficulty = (searchParams.get('difficulty') || '') as CourseDifficulty | ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', '9')
      if (currentSkillArea) params.set('skillArea', currentSkillArea)
      if (currentDifficulty) params.set('difficulty', currentDifficulty)

      const response = await fetch(`/api/assessments?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch assessments')
      }

      const data: AssessmentsResponse = await response.json()
      setAssessments(data.data.assessments)
      setPagination(data.data.pagination)
      setFilters(data.data.filters)
    } catch (_err) {
      setError('Failed to load assessments. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, currentSkillArea, currentDifficulty])

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/assessments/user/${user.id}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data: UserProfileResponse = await response.json()
        setUserStats(data.data.profile)
      }
    } catch (_err) {
      // User stats are optional - non-critical failure
    }
  }, [user?.id])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  useEffect(() => {
    fetchUserStats()
  }, [fetchUserStats])

  // Update URL with filters
  const updateFilters = (newFilters: {
    skillArea?: string
    difficulty?: string
    page?: number
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newFilters.skillArea !== undefined) {
      if (newFilters.skillArea) {
        params.set('skillArea', newFilters.skillArea)
      } else {
        params.delete('skillArea')
      }
      params.set('page', '1') // Reset to first page on filter change
    }

    if (newFilters.difficulty !== undefined) {
      if (newFilters.difficulty) {
        params.set('difficulty', newFilters.difficulty)
      } else {
        params.delete('difficulty')
      }
      params.set('page', '1')
    }

    if (newFilters.page !== undefined) {
      params.set('page', newFilters.page.toString())
    }

    router.push(`/assessments?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/assessments')
  }

  const hasActiveFilters = currentSkillArea || currentDifficulty

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Skill Assessments
            </h1>
            <p className="text-muted-foreground mt-1">
              Test your knowledge and earn skill badges
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.totalAssessments}</p>
                <p className="text-sm text-muted-foreground">Assessments Taken</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Trophy className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.passedCount}</p>
                <p className="text-sm text-muted-foreground">Assessments Passed</p>
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
                  {userStats.averageScore > 0 ? `${userStats.averageScore}%` : '-'}
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Skill Area Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
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

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
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
                    onClick={() => updateFilters({ difficulty })}
                    className={cn(
                      currentDifficulty === difficulty && difficulty === 'Beginner' && 'bg-success hover:bg-success/90',
                      currentDifficulty === difficulty && difficulty === 'Intermediate' && 'bg-warning hover:bg-warning/90',
                      currentDifficulty === difficulty && difficulty === 'Advanced' && 'bg-destructive hover:bg-destructive/90'
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

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchAssessments}>Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <AssessmentCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Assessments Grid */}
      {!loading && !error && (
        <>
          {assessments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No assessments found</p>
                <p className="text-muted-foreground">
                  Try adjusting your filters to find assessments
                </p>
                {hasActiveFilters && (
                  <Button className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          )}

          {/* Pagination */}
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
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and adjacent pages
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.page) <= 1
                    )
                  })
                  .map((page, index, array) => {
                    // Add ellipsis
                    const prevPage = array[index - 1]
                    const showEllipsis = prevPage && page - prevPage > 1

                    return (
                      <span key={page} className="flex items-center gap-2">
                        {showEllipsis && (
                          <span className="text-muted-foreground">...</span>
                        )}
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
      )}
    </div>
  )
}

export default function AssessmentsCatalogPage() {
  return (
    <ProtectedRoute>
      <AssessmentsCatalogContent />
    </ProtectedRoute>
  )
}
