'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, FileQuestion, Target, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssessmentWithUserScore, CourseDifficulty } from '@/types/assessment'
import { getSkillLevel, getSkillBadgeColor } from '@/types/assessment'

interface AssessmentCardProps {
  assessment: AssessmentWithUserScore
  className?: string
}

export function AssessmentCard({ assessment, className }: AssessmentCardProps) {
  const getDifficultyVariant = (difficulty: CourseDifficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'default'
      case 'Intermediate':
        return 'secondary'
      case 'Advanced':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const hasAttempted = assessment.userBestScore !== undefined

  return (
    <Card className={cn('relative group', className)}>
      {hasAttempted && assessment.userBestScore !== undefined && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shadow-lg',
            getSkillBadgeColor(getSkillLevel(assessment.userBestScore))
          )}>
            <Trophy className="h-3 w-3" />
            {assessment.userBestScore}%
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{assessment.name}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">
          {assessment.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getDifficultyVariant(assessment.difficulty)}>
            {assessment.difficulty}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            {assessment.skillArea}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{assessment.timeLimit} min</span>
          </div>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            <span>{assessment.totalQuestions} questions</span>
          </div>
        </div>

        {hasAttempted && (
          <div className="pt-2 border-t text-sm text-muted-foreground">
            <span>
              {assessment.userAttempts} attempt{assessment.userAttempts !== 1 ? 's' : ''}
              {assessment.lastAttemptDate && (
                <span className="ml-1">
                  - Last: {new Date(assessment.lastAttemptDate).toLocaleDateString()}
                </span>
              )}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full group-hover:shadow-lg transition-shadow">
          <Link href={`/assessments/${assessment.slug}`}>
            {hasAttempted ? 'View Details' : 'Start Assessment'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

interface AssessmentCardSkeletonProps {
  className?: string
}

export function AssessmentCardSkeleton({ className }: AssessmentCardSkeletonProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full mt-2" />
        <div className="h-4 bg-muted rounded w-2/3 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded-full w-20" />
          <div className="h-5 bg-muted rounded-full w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 bg-muted rounded w-full" />
      </CardFooter>
    </Card>
  )
}
