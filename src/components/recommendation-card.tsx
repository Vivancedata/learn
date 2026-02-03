'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RecommendationReason } from '@/components/recommendation-reason'
import { cn } from '@/lib/utils'
import type { RecommendationType } from '@prisma/client'

interface RecommendationCardProps {
  id: string
  courseId: string
  courseTitle: string
  courseDescription: string
  courseDifficulty: string
  courseDurationHours: number
  pathTitle: string
  score: number
  reason: string
  reasonType: RecommendationType
  userId: string
  onDismiss?: (courseId: string) => void
  onClick?: (courseId: string) => void
  showMatchScore?: boolean
  className?: string
}

export function RecommendationCard({
  courseId,
  courseTitle,
  courseDescription,
  courseDifficulty,
  courseDurationHours,
  pathTitle,
  score,
  reason,
  reasonType,
  userId,
  onDismiss,
  onClick,
  showMatchScore = false,
  className,
}: RecommendationCardProps) {
  const [isDismissing, setIsDismissing] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isDismissing) return

    setIsDismissing(true)

    try {
      const response = await fetch('/api/recommendations/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId }),
      })

      if (response.ok) {
        setIsDismissed(true)
        onDismiss?.(courseId)
      }
    } catch (_error) {
      // Dismiss failed - card will remain visible
    } finally {
      setIsDismissing(false)
    }
  }

  const handleClick = async () => {
    try {
      await fetch('/api/recommendations/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId }),
      })
      onClick?.(courseId)
    } catch (_error) {
      // Click tracking is non-critical
    }
  }

  if (isDismissed) {
    return null
  }

  const matchPercentage = Math.round(score * 100)

  return (
    <Card
      className={cn(
        'relative group transition-all duration-300',
        'hover:shadow-elevation-2 hover:-translate-y-1',
        className
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        disabled={isDismissing}
        className={cn(
          'absolute top-3 right-3 z-10',
          'w-7 h-7 rounded-full',
          'flex items-center justify-center',
          'bg-muted/80 hover:bg-muted',
          'text-muted-foreground hover:text-foreground',
          'opacity-0 group-hover:opacity-100',
          'transition-all duration-200',
          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isDismissing && 'cursor-not-allowed opacity-50'
        )}
        aria-label="Dismiss recommendation"
        title="Not interested"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Match score indicator */}
      {showMatchScore && (
        <div
          className={cn(
            'absolute top-3 left-3 z-10',
            'px-2 py-0.5 rounded-full',
            'bg-primary/10 text-primary',
            'text-xs font-semibold'
          )}
          role="status"
          aria-label={`${matchPercentage}% match`}
        >
          {matchPercentage}% match
        </div>
      )}

      <Link
        href={`/courses/${courseId}`}
        onClick={handleClick}
        className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
      >
        <CardHeader className={cn('pb-3', showMatchScore && 'pt-10')}>
          {/* Path indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span>{pathTitle}</span>
          </div>

          {/* Course title */}
          <h3 className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {courseTitle}
          </h3>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Course description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {courseDescription}
          </p>

          {/* Reason badge */}
          <RecommendationReason
            reasonType={reasonType}
            reason={reason}
            className="mb-3"
          />

          {/* Course metadata */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant={
                courseDifficulty === 'Beginner'
                  ? 'default'
                  : courseDifficulty === 'Intermediate'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {courseDifficulty}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {courseDurationHours} hours
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button className="w-full" variant="default">
            Start Learning
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Button>
        </CardFooter>
      </Link>
    </Card>
  )
}

export default RecommendationCard
