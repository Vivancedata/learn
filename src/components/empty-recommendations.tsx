'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyRecommendationsProps {
  variant?: 'default' | 'compact'
  className?: string
}

export function EmptyRecommendations({
  variant = 'default',
  className,
}: EmptyRecommendationsProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-8 px-4 text-center',
          className
        )}
      >
        <svg
          className="w-12 h-12 text-muted-foreground/50 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <p className="text-sm text-muted-foreground mb-4">
          Start a course or complete some lessons to get personalized recommendations.
        </p>
        <Button asChild size="sm">
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {/* Illustration */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl" />
          <svg
            className="relative w-24 h-24 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold mb-2">
          No Recommendations Yet
        </h3>
        <p className="text-muted-foreground max-w-md mb-6">
          We need to learn more about your interests to suggest courses tailored just for you.
          Start by exploring our course catalog or completing a few lessons.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/courses">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Browse Courses
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/paths">
              <svg
                className="w-4 h-4 mr-2"
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
              View Learning Paths
            </Link>
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 pt-6 border-t w-full max-w-md">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            How recommendations work:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Complete lessons to help us understand your interests</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Start a learning path for structured recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Take quizzes to identify areas for improvement</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default EmptyRecommendations
