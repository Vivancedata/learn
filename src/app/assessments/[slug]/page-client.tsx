'use client'

import { use, useCallback, useEffect, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressCircle } from '@/components/ui/progress-circle'
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
  type LucideIcon,
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

type AssessmentDetailData = AssessmentDetailResponse['data']
type AssessmentUserStats = AssessmentDetailData['userStats']
type AssessmentHistoryEntry = NonNullable<AssessmentUserStats>['history'][number]
type RelatedCourse = AssessmentDetailData['relatedCourse']

type AssessmentPageState = {
  data: AssessmentDetailData | null
  loading: boolean
  error: string | null
  isStarting: boolean
}

type AssessmentPageAction =
  | { type: 'fetchStarted' }
  | { type: 'fetchSucceeded'; data: AssessmentDetailData }
  | { type: 'fetchFailed'; error: string }
  | { type: 'startingAssessment' }

const initialState: AssessmentPageState = {
  data: null,
  loading: true,
  error: null,
  isStarting: false,
}

function assessmentDetailReducer(
  state: AssessmentPageState,
  action: AssessmentPageAction
): AssessmentPageState {
  switch (action.type) {
    case 'fetchStarted':
      return {
        ...state,
        loading: true,
        error: null,
      }
    case 'fetchSucceeded':
      return {
        ...state,
        data: action.data,
        loading: false,
        error: null,
      }
    case 'fetchFailed':
      return {
        ...state,
        loading: false,
        error: action.error,
      }
    case 'startingAssessment':
      return {
        ...state,
        isStarting: true,
      }
    default:
      return state
  }
}

function getDifficultyVariant(
  difficulty: CourseDifficulty
): 'default' | 'secondary' | 'destructive' | 'outline' {
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

function AssessmentBackButton({
  variant = 'ghost',
  className,
}: {
  variant?: 'ghost' | 'outline'
  className?: string
}) {
  return (
    <Button variant={variant} asChild className={cn('gap-2', className)}>
      <Link href="/assessments">
        <ArrowLeft className="h-4 w-4" />
        Back to Assessments
      </Link>
    </Button>
  )
}

function AssessmentLoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary" />
    </div>
  )
}

function AssessmentErrorState({
  error,
  onRetry,
}: {
  error: string | null
  onRetry: () => Promise<void>
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-xl font-semibold">
        {error === 'Assessment not found' ? 'Assessment Not Found' : 'Error Loading Assessment'}
      </h2>
      <p className="mb-4 text-muted-foreground">{error}</p>
      <div className="flex gap-2">
        <AssessmentBackButton variant="outline" />
        <Button
          onClick={() => {
            void onRetry()
          }}
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}

function AssessmentInfoTile({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: number | string
  label: string
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 text-center">
      <Icon className="mx-auto mb-2 h-6 w-6 text-primary" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function RelatedCourseCallout({ relatedCourse }: { relatedCourse: RelatedCourse }) {
  if (!relatedCourse) {
    return null
  }

  return (
    <div className="mb-6 rounded-lg border p-4">
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
  )
}

function AssessmentTips({ assessment }: { assessment: SkillAssessment }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <Award className="h-5 w-5 text-primary" />
        Tips for Success
      </h3>
      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
        <li>Read each question carefully before answering</li>
        <li>Manage your time - you have {assessment.timeLimit} minutes</li>
        <li>Flag difficult questions to review later</li>
        <li>You need {assessment.passingScore}% to pass and earn a skill badge</li>
      </ul>
    </div>
  )
}

function AssessmentOverviewCard({
  assessment,
  relatedCourse,
  bestScore,
  hasAttempts,
  hasPassed,
  isSignedIn,
  attemptCount,
  isStarting,
  onStartAssessment,
}: {
  assessment: SkillAssessment
  relatedCourse: RelatedCourse
  bestScore: number | undefined
  hasAttempts: boolean
  hasPassed: boolean
  isSignedIn: boolean
  attemptCount: number | string
  isStarting: boolean
  onStartAssessment: () => void
}) {
  const startButtonLabel = isSignedIn
    ? hasAttempts
      ? 'Retake Assessment'
      : 'Start Assessment'
    : 'Sign In to Start Assessment'

  return (
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
                <Badge className="gap-1 bg-success text-success-foreground">
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
              <ProgressCircle progress={bestScore} size="lg" showPercentage />
              <span className="mt-2 text-sm text-muted-foreground">Best Score</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <AssessmentInfoTile icon={Clock} value={assessment.timeLimit} label="Minutes" />
          <AssessmentInfoTile
            icon={FileQuestion}
            value={assessment.totalQuestions}
            label="Questions"
          />
          <AssessmentInfoTile
            icon={Target}
            value={`${assessment.passingScore}%`}
            label="Passing Score"
          />
          <AssessmentInfoTile
            icon={History}
            value={attemptCount}
            label={isSignedIn ? 'Your Attempts' : 'Sign in to track attempts'}
          />
        </div>

        <RelatedCourseCallout relatedCourse={relatedCourse} />
        <AssessmentTips assessment={assessment} />
      </CardContent>

      <CardFooter>
        <Button
          onClick={onStartAssessment}
          disabled={isStarting}
          size="lg"
          className="w-full gap-2"
          variant={isSignedIn ? 'gradient' : 'default'}
        >
          {isStarting ? (
            <span className="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-white" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          {startButtonLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}

function AttemptHistoryItem({
  attempt,
  attemptNumber,
}: {
  attempt: AssessmentHistoryEntry
  attemptNumber: number
}) {
  const skillLevel = getSkillLevel(attempt.score)

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        attempt.passed ? 'border-success/30 bg-success/5' : 'bg-muted/50'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {attempt.passed ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <span className="font-medium">Attempt {attemptNumber}</span>
        </div>
        <span
          className={cn(
            'rounded px-2 py-0.5 text-sm font-bold',
            getSkillBadgeColor(skillLevel)
          )}
        >
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
}

function AssessmentHistoryCard({
  isSignedIn,
  hasAttempts,
  signInHref,
  userStats,
}: {
  isSignedIn: boolean
  hasAttempts: boolean
  signInHref: string
  userStats: AssessmentUserStats
}) {
  const history = userStats?.history ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Your Attempt History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isSignedIn ? (
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="mb-3">Sign in to track your attempt history.</p>
            <Button asChild size="sm">
              <Link href={signInHref}>Sign In</Link>
            </Button>
          </div>
        ) : !hasAttempts ? (
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No attempts yet</p>
            <p className="text-sm">Start the assessment to test your skills!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((attempt, index) => (
              <AttemptHistoryItem
                key={attempt.id}
                attempt={attempt}
                attemptNumber={history.length - index}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BestPerformanceCard({
  bestScore,
  hasPassed,
  passingScore,
}: {
  bestScore: number
  hasPassed: boolean
  passingScore: number
}) {
  const skillLevel = getSkillLevel(bestScore)

  return (
    <Card className={cn(hasPassed && 'border-success/30')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Best Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ProgressCircle progress={bestScore} size="lg" showPercentage />
          <div>
            <div
              className={cn(
                'mb-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
                getSkillBadgeColor(skillLevel)
              )}
            >
              <Award className="h-4 w-4" />
              {skillLevel} level
            </div>
            {hasPassed ? (
              <p className="flex items-center gap-1 text-sm text-success">
                <CheckCircle className="h-4 w-4" />
                You have passed this assessment!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Need {passingScore}% to pass
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AssessmentDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [state, dispatch] = useReducer(assessmentDetailReducer, initialState)

  const assessmentHref = `/assessments/${slug}`
  const signInHref = `/sign-in?redirect=${encodeURIComponent(assessmentHref)}`

  const fetchAssessmentDetails = useCallback(async () => {
    dispatch({ type: 'fetchStarted' })

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
      dispatch({ type: 'fetchSucceeded', data: data.data })
    } catch (err) {
      dispatch({
        type: 'fetchFailed',
        error: err instanceof Error ? err.message : 'Failed to load assessment',
      })
    }
  }, [slug])

  useEffect(() => {
    void fetchAssessmentDetails()
  }, [fetchAssessmentDetails])

  const handleStartAssessment = () => {
    if (!user) {
      router.push(signInHref)
      return
    }

    dispatch({ type: 'startingAssessment' })
    router.push(`${assessmentHref}/take`)
  }

  if (state.loading) {
    return <AssessmentLoadingState />
  }

  const assessment = state.data?.assessment ?? null

  if (state.error || !assessment) {
    return <AssessmentErrorState error={state.error} onRetry={fetchAssessmentDetails} />
  }

  const userStats = state.data?.userStats ?? null
  const relatedCourse = state.data?.relatedCourse
  const isSignedIn = Boolean(user)
  const hasAttempts = Boolean(userStats?.attempts)
  const bestScore = userStats?.bestScore
  const hasPassed = Boolean(userStats?.history.some((attempt) => attempt.passed))

  return (
    <div className="space-y-8">
      <AssessmentBackButton />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AssessmentOverviewCard
            assessment={assessment}
            relatedCourse={relatedCourse}
            bestScore={bestScore}
            hasAttempts={hasAttempts}
            hasPassed={hasPassed}
            isSignedIn={isSignedIn}
            attemptCount={isSignedIn ? userStats?.attempts ?? 0 : '—'}
            isStarting={state.isStarting}
            onStartAssessment={handleStartAssessment}
          />
        </div>

        <div className="space-y-6">
          <AssessmentHistoryCard
            isSignedIn={isSignedIn}
            hasAttempts={hasAttempts}
            signInHref={signInHref}
            userStats={userStats}
          />
          {bestScore !== undefined && (
            <BestPerformanceCard
              bestScore={bestScore}
              hasPassed={hasPassed}
              passingScore={assessment.passingScore}
            />
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
  return <AssessmentDetailContent params={params} />
}
