"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import {
  Github,
  Globe,
  Heart,
  Loader2,
  Users,
  ExternalLink,
  Share2,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface Solution {
  id: string
  githubUrl: string
  liveUrl: string | null
  description: string | null
  likesCount: number
  submittedAt: string
  user: {
    id: string
    name: string
    githubUsername: string | null
  }
  isLikedByUser: boolean
}

interface SolutionsResponse {
  solutions: Solution[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

interface StudentSolutionsProps {
  lessonId: string
  courseId: string
}

export function StudentSolutions({ lessonId, courseId }: StudentSolutionsProps) {
  const { user, loading: authLoading } = useAuth()
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set())

  const fetchSolutions = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch(
        `/api/solutions?lessonId=${encodeURIComponent(lessonId)}&page=${pageNum}&limit=12`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch solutions')
      }

      const data = await response.json() as { data: SolutionsResponse }
      const { solutions: newSolutions, pagination } = data.data

      if (append) {
        setSolutions((prev) => [...prev, ...newSolutions])
      } else {
        setSolutions(newSolutions)
      }

      setHasMore(pagination.hasMore)
      setTotalCount(pagination.totalCount)
      setPage(pageNum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch solutions')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [lessonId])

  useEffect(() => {
    fetchSolutions(1)
  }, [fetchSolutions])

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSolutions(page + 1, true)
    }
  }

  const handleLike = async (solutionId: string) => {
    if (!user) {
      // Could redirect to login or show a message
      return
    }

    // Prevent multiple clicks
    if (likingIds.has(solutionId)) {
      return
    }

    setLikingIds((prev) => new Set(prev).add(solutionId))

    try {
      const response = await fetch(`/api/solutions/${solutionId}/like`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update like')
      }

      const data = await response.json() as { data: { liked: boolean; likesCount: number } }

      // Update the solution in the list
      setSolutions((prev) =>
        prev.map((s) =>
          s.id === solutionId
            ? { ...s, isLikedByUser: data.data.liked, likesCount: data.data.likesCount }
            : s
        )
      )
    } catch (err) {
      console.error('Failed to like solution:', err)
    } finally {
      setLikingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(solutionId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const extractRepoName = (githubUrl: string) => {
    try {
      const url = new URL(githubUrl)
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`
      }
      return githubUrl
    } catch {
      return githubUrl
    }
  }

  // Show loading skeleton
  if (loading && !authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Solutions
          </CardTitle>
          <CardDescription>
            See how other students approached this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading solutions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Solutions
          </CardTitle>
          <CardDescription>
            See how other students approached this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchSolutions(1)}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state
  if (solutions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Solutions
          </CardTitle>
          <CardDescription>
            See how other students approached this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No solutions shared yet</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Be the first to share your solution! Once your project is approved,
              you can make it public for other students to learn from.
            </p>
            {user && (
              <Button
                variant="outline"
                className="mt-4"
                asChild
              >
                <a href={`/courses/${courseId}/${lessonId}#project-submission`}>
                  Submit Your Project
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Solutions
            </CardTitle>
            <CardDescription>
              {totalCount} solution{totalCount !== 1 ? 's' : ''} shared by students
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solutions.map((solution) => (
            <div
              key={solution.id}
              className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
            >
              {/* User info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {solution.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{solution.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(solution.submittedAt)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${solution.isLikedByUser ? 'text-destructive' : ''}`}
                  onClick={() => handleLike(solution.id)}
                  disabled={!user || likingIds.has(solution.id) || solution.user.id === user?.id}
                  title={
                    !user
                      ? 'Sign in to like'
                      : solution.user.id === user?.id
                        ? 'You cannot like your own solution'
                        : solution.isLikedByUser
                          ? 'Unlike'
                          : 'Like'
                  }
                >
                  {likingIds.has(solution.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-4 w-4 ${solution.isLikedByUser ? 'fill-current' : ''}`}
                    />
                  )}
                  <span className="ml-1 text-xs">{solution.likesCount}</span>
                </Button>
              </div>

              {/* Description */}
              {solution.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {solution.description}
                </p>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  asChild
                >
                  <a
                    href={solution.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-3.5 w-3.5 mr-1" />
                    {extractRepoName(solution.githubUrl)}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                {solution.liveUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    asChild
                  >
                    <a
                      href={solution.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-3.5 w-3.5 mr-1" />
                      Live Demo
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Solutions'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
