'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressCircle } from '@/components/ui/progress-circle'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import {
  Target,
  Clock,
  FileQuestion,
  Trophy,
  CheckCircle,
  XCircle,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  Play,
  History,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillAssessment, CourseDifficulty } from '@/types/assessment'
import { getSkillLevel, getSkillBadgeColor, formatTime } from '@/types/assessment'

interface AssessmentDetailResponse {
  data: {
    assessment: SkillAssessment
    userStats: {
      attempts: number
      bestScore: number | undefined
      history: {
        id: string
        score: number
        passed: boolean
        timeSpent: number
        completedAt: string
      }[]
    } | null
    relatedCourse: {
      id: string
      title: string
    } | undefined
  }
}

function AssessmentDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  useAuth() // Ensure user is authenticated
  const router = useRouter()

  const [assessment, setAssessment] = useState<SkillAssessment | null>(null)
  const [userStats, setUserStats] = useState<AssessmentDetailResponse['data']['userStats']>(null)
  const [relatedCourse, setRelatedCourse] = useState<AssessmentDetailResponse['data']['relatedCourse']>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const fetchAssessmentDetails = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/assessments/${slug}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Assessment not found')
        }
        throw new Error('Failed to fetch assessment details')
      }

      const data: AssessmentDetailResponse = await response.json()
      setAssessment(data.data.assessment)
      setUserStats(data.data.userStats)
      setRelatedCourse(data.data.relatedCourse)
    } catch (err) {
      console.error('Error fetching assessment:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchAssessmentDetails()
  }, [fetchAssessmentDetails])

  const handleStartAssessment = () => {
    setIsStarting(true)
    router.push(`/assessments/${slug}/take`)
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {error === 'Assessment not found' ? 'Assessment Not Found' : 'Error Loading Assessment'}
        </h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/assessments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Link>
          </Button>
          <Button onClick={fetchAssessmentDetails}>Try Again</Button>
        </div>
      </div>
    )
  }

  const hasAttempts = userStats && userStats.attempts > 0
  const bestScore = userStats?.bestScore
  const hasPassed = userStats?.history.some((h) => h.passed)

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/assessments">
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Link>
      </Button>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getDifficultyVariant(assessment.difficulty)}>
                      {assessment.difficulty}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Target className="h-3 w-3" />
                      {assessment.skillArea}
                    </Badge>
                    {hasPassed && (
                      <Badge className="bg-success text-success-foreground gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Passed
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{assessment.name}</CardTitle>
                  <CardDescription className="text-base">
                    {assessment.description}
                  </CardDescription>
                </div>

                {bestScore !== undefined && (
                  <div className="flex flex-col items-center">
                    <ProgressCircle
                      progress={bestScore}
                      size="lg"
                      showPercentage
                    />
                    <span className="text-sm text-muted-foreground mt-2">Best Score</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Assessment Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{assessment.timeLimit}</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <FileQuestion className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{assessment.totalQuestions}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{assessment.passingScore}%</p>
                  <p className="text-sm text-muted-foreground">Passing Score</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <History className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{userStats?.attempts || 0}</p>
                  <p className="text-sm text-muted-foreground">Your Attempts</p>
                </div>
              </div>

              {/* Related Course */}
              {relatedCourse && (
                <div className="p-4 border rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Related Course</p>
                        <p className="font-medium">{relatedCourse.title}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/courses/${relatedCourse.id}`}>View Course</Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Tips for Success
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Read each question carefully before answering</li>
                  <li>Manage your time - you have {assessment.timeLimit} minutes</li>
                  <li>Flag difficult questions to review later</li>
                  <li>You need {assessment.passingScore}% to pass and earn a skill badge</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={handleStartAssessment}
                disabled={isStarting}
                size="lg"
                className="w-full gap-2"
                variant="gradient"
              >
                {isStarting ? (
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                {hasAttempts ? 'Retake Assessment' : 'Start Assessment'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column - History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Your Attempt History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAttempts ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No attempts yet</p>
                  <p className="text-sm">Start the assessment to test your skills!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userStats?.history.map((attempt, index) => {
                    const skillLevel = getSkillLevel(attempt.score)
                    return (
                      <div
                        key={attempt.id}
                        className={cn(
                          'p-4 rounded-lg border transition-colors',
                          attempt.passed
                            ? 'bg-success/5 border-success/30'
                            : 'bg-muted/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {attempt.passed ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                            <span className="font-medium">
                              Attempt {userStats.history.length - index}
                            </span>
                          </div>
                          <span className={cn(
                            'text-sm font-bold px-2 py-0.5 rounded',
                            getSkillBadgeColor(skillLevel)
                          )}>
                            {attempt.score}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(attempt.timeSpent)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Score Card */}
          {bestScore !== undefined && (
            <Card className={cn(hasPassed && 'border-success/30')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Best Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ProgressCircle
                    progress={bestScore}
                    size="lg"
                    showPercentage
                  />
                  <div>
                    <div className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mb-2',
                      getSkillBadgeColor(getSkillLevel(bestScore))
                    )}>
                      <Award className="h-4 w-4" />
                      {getSkillLevel(bestScore)} level
                    </div>
                    {hasPassed ? (
                      <p className="text-sm text-success flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        You have passed this assessment!
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Need {assessment.passingScore}% to pass
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <ProtectedRoute>
      <AssessmentDetailContent params={params} />
    </ProtectedRoute>
  )
}
