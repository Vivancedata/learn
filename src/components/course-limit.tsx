'use client'

import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Lock, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/features'

interface CourseLimitProps {
  coursesStarted: number
  className?: string
}

/**
 * Component showing course usage for free users
 * Displays progress toward the limit and upgrade prompt
 */
export function CourseLimitIndicator({ coursesStarted, className = '' }: CourseLimitProps) {
  const { isPro, loading } = useSubscription()

  if (loading || isPro) return null

  const maxCourses = PLAN_LIMITS.FREE.maxCourses
  const remaining = Math.max(0, maxCourses - coursesStarted)
  const progress = (coursesStarted / maxCourses) * 100
  const hasReachedLimit = coursesStarted >= maxCourses

  return (
    <div className={`flex items-center gap-3 p-3 bg-muted rounded-lg ${className}`}>
      <div className="flex-shrink-0">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {coursesStarted} of {maxCourses} courses used
          </span>
          {hasReachedLimit && (
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Limit reached
            </Badge>
          )}
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all ${
              hasReachedLimit ? 'bg-destructive' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        {!hasReachedLimit && (
          <p className="text-xs text-muted-foreground mt-1">
            {remaining} course slot{remaining !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>
      <Button size="sm" asChild>
        <Link href="/pricing">
          <Crown className="h-3 w-3 mr-1" />
          Upgrade
        </Link>
      </Button>
    </div>
  )
}

/**
 * Card shown when user has reached their free course limit
 */
export function CourseLimitReachedCard({ className = '' }: { className?: string }) {
  return (
    <Card className={`border-primary/50 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Course Limit Reached</CardTitle>
        <CardDescription>
          You&apos;ve started {PLAN_LIMITS.FREE.maxCourses} courses on the free plan
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-4">
          Upgrade to Pro for unlimited course access, skill assessments,
          verified certificates, and more.
        </p>
        <ul className="text-left max-w-xs mx-auto space-y-2 mb-4">
          {[
            'Unlimited course access',
            'Skill assessments',
            'Verified certificates',
            'Priority support',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-center">
        <Button asChild>
          <Link href="/pricing">
            View Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Inline message for showing on course cards when limit is reached
 */
export function CourseLimitMessage({ className = '' }: { className?: string }) {
  const { isPro, loading } = useSubscription()

  if (loading || isPro) return null

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Lock className="h-4 w-4" />
      <span>Upgrade to access this course</span>
      <Button size="sm" variant="link" asChild className="p-0 h-auto">
        <Link href="/pricing">View plans</Link>
      </Button>
    </div>
  )
}

/**
 * Hook for checking if user can start a new course
 */
export function useCanStartCourse(coursesStarted: number): {
  canStart: boolean
  remaining: number
  isLoading: boolean
} {
  const { isPro, loading } = useSubscription()

  if (loading) {
    return { canStart: true, remaining: PLAN_LIMITS.FREE.maxCourses, isLoading: true }
  }

  if (isPro) {
    return { canStart: true, remaining: Infinity, isLoading: false }
  }

  const remaining = Math.max(0, PLAN_LIMITS.FREE.maxCourses - coursesStarted)
  return {
    canStart: remaining > 0,
    remaining,
    isLoading: false,
  }
}
