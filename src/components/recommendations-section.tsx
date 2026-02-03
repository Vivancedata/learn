'use client'

import { useState, useEffect, useCallback } from 'react'
import { RecommendationCard } from '@/components/recommendation-card'
import { EmptyRecommendations } from '@/components/empty-recommendations'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { RecommendationType } from '@prisma/client'

interface Recommendation {
  id: string
  courseId: string
  courseTitle: string
  courseDescription: string
  courseDifficulty: string
  courseDurationHours: number
  pathId: string
  pathTitle: string
  score: number
  reason: string
  reasonType: RecommendationType
  createdAt: string
  expiresAt: string
}

interface RecommendationsSectionProps {
  userId: string
  title?: string
  description?: string
  showMatchScores?: boolean
  maxItems?: number
  variant?: 'grid' | 'carousel'
  emptyVariant?: 'default' | 'compact'
  className?: string
}

export function RecommendationsSection({
  userId,
  title = 'Recommended For You',
  description,
  showMatchScores = false,
  maxItems = 6,
  variant = 'grid',
  emptyVariant = 'default',
  className,
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)

  const fetchRecommendations = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/recommendations/user/${userId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to load recommendations')
      }

      const data = await response.json()
      setRecommendations(data.data.recommendations.slice(0, maxItems))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }, [userId, maxItems])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/recommendations/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh recommendations')
      }

      const data = await response.json()
      setRecommendations(data.data.recommendations.slice(0, maxItems))
      setCarouselIndex(0)
    } catch (_err) {
      // Refresh failed - user can try again
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDismiss = (courseId: string) => {
    setRecommendations(prev => prev.filter(r => r.courseId !== courseId))
  }

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // Carousel navigation
  const itemsPerView = variant === 'carousel' ? 3 : recommendations.length
  const maxIndex = Math.max(0, recommendations.length - itemsPerView)

  const handlePrev = () => {
    setCarouselIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCarouselIndex(prev => Math.min(maxIndex, prev + 1))
  }

  if (isLoading) {
    return (
      <section className={cn('py-6', className)} aria-busy="true">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
          <span className="ml-3 text-muted-foreground">Loading recommendations...</span>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={cn('py-6', className)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        <div
          className="bg-destructive/10 text-destructive rounded-lg p-4 text-center"
          role="alert"
        >
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true)
              fetchRecommendations()
            }}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      </section>
    )
  }

  if (recommendations.length === 0) {
    return (
      <section className={cn('py-6', className)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        <EmptyRecommendations variant={emptyVariant} />
      </section>
    )
  }

  return (
    <section className={cn('py-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg
              className={cn(
                'w-4 h-4 mr-2',
                isRefreshing && 'animate-spin'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {/* Carousel navigation */}
          {variant === 'carousel' && recommendations.length > itemsPerView && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={carouselIndex === 0}
                className="h-8 w-8"
                aria-label="Previous recommendations"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={carouselIndex >= maxIndex}
                className="h-8 w-8"
                aria-label="Next recommendations"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations grid/carousel */}
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              {...recommendation}
              userId={userId}
              onDismiss={handleDismiss}
              showMatchScore={showMatchScores}
            />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)`,
            }}
          >
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="flex-shrink-0"
                style={{ width: `calc((100% - ${(itemsPerView - 1) * 24}px) / ${itemsPerView})` }}
              >
                <RecommendationCard
                  {...recommendation}
                  userId={userId}
                  onDismiss={handleDismiss}
                  showMatchScore={showMatchScores}
                />
              </div>
            ))}
          </div>

          {/* Carousel indicators */}
          {recommendations.length > itemsPerView && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCarouselIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    index === carouselIndex
                      ? 'bg-primary w-4'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === carouselIndex ? 'true' : 'false'}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default RecommendationsSection
