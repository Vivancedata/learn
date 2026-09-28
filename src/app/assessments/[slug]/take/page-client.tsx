'use client'

import { use, useCallback, useEffect, useEffectEvent, useReducer, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AssessmentQuestion } from '@/components/assessment-question'
import { AssessmentTimer } from '@/components/assessment-timer'
import {
  AssessmentNavigation,
  AssessmentNavigationCompact,
  QuestionStatus,
} from '@/components/assessment-navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  Send,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  assessmentTakeReducer,
  createInitialAssessmentTakeState,
  type AnswerValue,
  type AssessmentData,
  type AssessmentQuestionData,
  type AssessmentStartResponse,
} from './take-reducer'

interface SubmitResponse {
  data: {
    attemptId: string
    score: number
    passed: boolean
    correctCount: number
    totalCount: number
    passingScore: number
    xpAwarded: number
    questionResults: {
      questionId: string
      correct: boolean
      userAnswer: string | string[] | number
      correctAnswer: string | string[] | number
      explanation: string
    }[]
    skillLevel: string
  }
}

function getQuestionStatuses(
  questions: AssessmentData['questions'],
  currentQuestionIndex: number,
  flaggedQuestions: Set<number>,
  answers: Record<string, AnswerValue>
): QuestionStatus[] {
  return questions.map((question, index) => {
    if (index === currentQuestionIndex) return 'current'
    if (flaggedQuestions.has(index)) return 'flagged'
    if (answers[question.id] !== undefined) return 'answered'
    return 'unanswered'
  })
}

/**
 * Modal dialog behaviour: move focus into the dialog on open, keep Tab inside
 * it, close on Escape, and hand focus back to the trigger on close.
 */
function useModalDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const close = useEffectEvent(onClose)

  useEffect(() => {
    if (!isOpen) return

    const dialog = dialogRef.current
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]'
        ) ?? []
      ).filter((element) => element.tabIndex >= 0)

    focusable()[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        return
      }
      if (event.key !== 'Tab') return

      const elements = focusable()
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      trigger?.focus()
    }
  }, [isOpen])

  return dialogRef
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center" role="status">
      <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand" aria-hidden="true" />
      <p className="text-muted-foreground">Loading assessment…</p>
    </div>
  )
}

function ErrorState({
  error,
  onRetry,
  onBack,
}: {
  error: string | null
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-xl font-semibold">Error Loading Assessment</h2>
      <p className="mb-4 text-muted-foreground">{error}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Go Back
        </Button>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    </div>
  )
}

function AssessmentHeader({
  assessmentData,
  currentQuestionIndex,
  answeredCount,
  flaggedCount,
  onTimeUp,
  onOpenSidebar,
  onOpenSubmitModal,
}: {
  assessmentData: AssessmentData
  currentQuestionIndex: number
  answeredCount: number
  flaggedCount: number
  onTimeUp: () => void
  onOpenSidebar: () => void
  onOpenSubmitModal: () => void
}) {
  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="sr-only max-w-xs truncate text-lg font-semibold sm:not-sr-only sm:block">
              {assessmentData.name}
            </h1>
            <AssessmentNavigationCompact
              totalQuestions={assessmentData.questions.length}
              currentQuestion={currentQuestionIndex}
              answeredCount={answeredCount}
              flaggedCount={flaggedCount}
              className="hidden md:block"
            />
          </div>

          <div className="flex items-center gap-3">
            <AssessmentTimer
              timeLimit={assessmentData.timeLimit}
              startedAt={assessmentData.startedAt}
              onTimeUp={onTimeUp}
            />

            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={onOpenSidebar}
            >
              Questions
            </Button>

            <Button
              onClick={onOpenSubmitModal}
              size="sm"
              className="gap-2"
              aria-label="Submit assessment"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Submit</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssessmentQuestionCard({
  question,
  currentQuestionIndex,
  totalQuestions,
  currentAnswer,
  isFlagged,
  onAnswerChange,
  onToggleFlag,
  onPrevious,
  onNext,
  onSubmit,
}: {
  question: AssessmentQuestionData
  currentQuestionIndex: number
  totalQuestions: number
  currentAnswer: AnswerValue | undefined
  isFlagged: boolean
  onAnswerChange: (answer: AnswerValue) => void
  onToggleFlag: () => void
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
}) {
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  return (
    <Card>
      <CardContent className="p-6">
        <AssessmentQuestion
          question={question}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          selectedAnswer={currentAnswer}
          onAnswerChange={onAnswerChange}
        />

        <div className="mt-6 border-t pt-6">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isFlagged}
              onChange={onToggleFlag}
              className="h-4 w-4 rounded border-input accent-warning"
            />
            <Flag
              className={cn(
                'h-4 w-4',
                isFlagged ? 'text-warning' : 'text-muted-foreground'
              )}
            />
            <span className="text-sm">Flag for review</span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>

          {isLastQuestion ? (
            <Button onClick={onSubmit} className="gap-2">
              Submit
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DesktopQuestionSidebar({
  totalQuestions,
  currentQuestionIndex,
  questionStatuses,
  onQuestionClick,
}: {
  totalQuestions: number
  currentQuestionIndex: number
  questionStatuses: QuestionStatus[]
  onQuestionClick: (index: number) => void
}) {
  return (
    <div className="hidden lg:block">
      <Card className="sticky top-24">
        <CardHeader className="pb-3">
          <h3 className="font-semibold">Questions</h3>
        </CardHeader>
        <CardContent>
          <AssessmentNavigation
            totalQuestions={totalQuestions}
            currentQuestion={currentQuestionIndex}
            questionStatuses={questionStatuses}
            onQuestionClick={onQuestionClick}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function MobileQuestionSidebar({
  isOpen,
  totalQuestions,
  currentQuestionIndex,
  questionStatuses,
  onQuestionClick,
  onClose,
}: {
  isOpen: boolean
  totalQuestions: number
  currentQuestionIndex: number
  questionStatuses: QuestionStatus[]
  onQuestionClick: (index: number) => void
  onClose: () => void
}) {
  const dialogRef = useModalDialog(isOpen, onClose)

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-sidebar-title"
    >
      <button
        type="button"
        aria-label="Close question sidebar"
        tabIndex={-1}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-80 max-w-full border-l bg-card shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h3 id="question-sidebar-title" className="font-semibold">Questions</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close questions">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain p-4">
          <AssessmentNavigation
            totalQuestions={totalQuestions}
            currentQuestion={currentQuestionIndex}
            questionStatuses={questionStatuses}
            onQuestionClick={onQuestionClick}
          />
        </div>
      </div>
    </div>
  )
}

function SubmitConfirmationModal({
  isOpen,
  answeredCount,
  totalQuestions,
  unansweredCount,
  flaggedCount,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  answeredCount: number
  totalQuestions: number
  unansweredCount: number
  flaggedCount: number
  isSubmitting: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const dialogRef = useModalDialog(isOpen, onClose)

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-confirmation-title"
    >
      <button
        type="button"
        aria-label="Close submit confirmation"
        tabIndex={-1}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <h2 id="submit-confirmation-title" className="text-xl font-semibold">
            Submit Assessment?
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Questions Answered</span>
              <span className="font-medium">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            {unansweredCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-medium text-warning">
                    {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered
                  </p>
                  <p className="text-muted-foreground">
                    Unanswered questions will be marked as incorrect.
                  </p>
                </div>
              </div>
            )}
            {flaggedCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flag className="h-4 w-4 text-warning" />
                <span>
                  {flaggedCount} question{flaggedCount !== 1 ? 's' : ''} flagged for review
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Review Answers
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting} className="flex-1 gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SubmittingOverlay({ isSubmitting }: { isSubmitting: boolean }) {
  if (!isSubmitting) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-busy="true"
    >
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand" aria-hidden="true" />
        <p className="text-lg font-medium">Submitting your assessment…</p>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  )
}

function AssessmentTakeContent({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [state, dispatch] = useReducer(
    assessmentTakeReducer,
    undefined,
    createInitialAssessmentTakeState
  )

  const submittedRef = useRef(false)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.assessmentData && !submittedRef.current) {
        event.preventDefault()
        event.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.assessmentData])

  const startAssessment = useCallback(async () => {
    if (!user?.id) {
      return
    }

    dispatch({ type: 'startRequested' })

    try {
      const response = await fetch(`/api/assessments/${slug}/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to start assessment')
      }

      const data: AssessmentStartResponse = await response.json()
      dispatch({ type: 'startSucceeded', assessmentData: data.data })
      startTimeRef.current = Date.now()
    } catch {
      dispatch({
        type: 'startFailed',
        error: 'Failed to start assessment. Please try again.',
      })
    }
  }, [slug, user?.id])

  useEffect(() => {
    void startAssessment()
  }, [startAssessment])

  const submitAssessment = useCallback(async () => {
    if (!user?.id || !state.assessmentData || submittedRef.current || state.isSubmitting) {
      return
    }

    submittedRef.current = true
    dispatch({ type: 'submissionStarted' })

    const endTime = Date.now()
    const timeSpent = startTimeRef.current
      ? Math.floor((endTime - startTimeRef.current) / 1000)
      : 0

    try {
      const response = await fetch(`/api/assessments/${slug}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: state.assessmentData.attemptId,
          userId: user.id,
          answers: state.answers,
          timeSpent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit assessment')
      }

      const data: SubmitResponse = await response.json()

      sessionStorage.setItem(
        `assessment-results-${slug}`,
        JSON.stringify({
          ...data.data,
          assessmentName: state.assessmentData.name,
          timeLimit: state.assessmentData.timeLimit,
          questions: state.assessmentData.questions,
          timeSpent,
        })
      )

      router.push(`/assessments/${slug}/results`)
    } catch {
      submittedRef.current = false
      dispatch({
        type: 'submissionFailed',
        error: 'Failed to submit assessment. Please try again.',
      })
    }
  }, [router, slug, state.answers, state.assessmentData, state.isSubmitting, user?.id])

  const handleTimeUp = useCallback(() => {
    if (!submittedRef.current) {
      void submitAssessment()
    }
  }, [submitAssessment])

  const handleAnswerChange = (answer: AnswerValue) => {
    if (!state.assessmentData) {
      return
    }

    const questionId = state.assessmentData.questions[state.currentQuestionIndex].id
    dispatch({ type: 'answerChanged', questionId, answer })
  }

  const handleFlagToggle = () => {
    dispatch({ type: 'flagToggled', questionIndex: state.currentQuestionIndex })
  }

  const handleQuestionSelect = (questionIndex: number) => {
    dispatch({ type: 'questionSelected', questionIndex })
  }

  const handlePrevious = () => {
    dispatch({ type: 'previousQuestion' })
  }

  const handleNext = () => {
    if (!state.assessmentData) {
      return
    }

    dispatch({
      type: 'nextQuestion',
      totalQuestions: state.assessmentData.questions.length,
    })
  }

  if (state.loading) {
    return <LoadingState />
  }

  if (state.error || !state.assessmentData) {
    return (
      <ErrorState
        error={state.error}
        onBack={() => router.push(`/assessments/${slug}`)}
        onRetry={startAssessment}
      />
    )
  }

  const { assessmentData } = state
  const currentQuestion = assessmentData.questions[state.currentQuestionIndex]
  const currentAnswer = state.answers[currentQuestion.id]
  const answeredCount = Object.keys(state.answers).length
  const unansweredCount = assessmentData.questions.length - answeredCount
  const flaggedCount = state.flaggedQuestions.size
  const questionStatuses = getQuestionStatuses(
    assessmentData.questions,
    state.currentQuestionIndex,
    state.flaggedQuestions,
    state.answers
  )

  return (
    <div className="min-h-screen bg-background">
      <AssessmentHeader
        assessmentData={assessmentData}
        currentQuestionIndex={state.currentQuestionIndex}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        onTimeUp={handleTimeUp}
        onOpenSidebar={() => dispatch({ type: 'sidebarOpened' })}
        onOpenSubmitModal={() => dispatch({ type: 'submitModalOpened' })}
      />

      <div className="container py-6">
        {state.submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {state.submitError} Your answers are still here.
              </span>
              <Button
                size="sm"
                onClick={() => {
                  void submitAssessment()
                }}
                disabled={state.isSubmitting}
              >
                Retry submission
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <AssessmentQuestionCard
              question={currentQuestion}
              currentQuestionIndex={state.currentQuestionIndex}
              totalQuestions={assessmentData.questions.length}
              currentAnswer={currentAnswer}
              isFlagged={state.flaggedQuestions.has(state.currentQuestionIndex)}
              onAnswerChange={handleAnswerChange}
              onToggleFlag={handleFlagToggle}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={() => dispatch({ type: 'submitModalOpened' })}
            />
          </div>

          <DesktopQuestionSidebar
            totalQuestions={assessmentData.questions.length}
            currentQuestionIndex={state.currentQuestionIndex}
            questionStatuses={questionStatuses}
            onQuestionClick={handleQuestionSelect}
          />
        </div>
      </div>

      <MobileQuestionSidebar
        isOpen={state.showSidebar}
        totalQuestions={assessmentData.questions.length}
        currentQuestionIndex={state.currentQuestionIndex}
        questionStatuses={questionStatuses}
        onQuestionClick={handleQuestionSelect}
        onClose={() => dispatch({ type: 'sidebarClosed' })}
      />

      <SubmitConfirmationModal
        isOpen={state.showSubmitModal}
        answeredCount={answeredCount}
        totalQuestions={assessmentData.questions.length}
        unansweredCount={unansweredCount}
        flaggedCount={flaggedCount}
        isSubmitting={state.isSubmitting}
        onClose={() => dispatch({ type: 'submitModalClosed' })}
        onSubmit={() => {
          void submitAssessment()
        }}
      />

      <SubmittingOverlay isSubmitting={state.isSubmitting} />
    </div>
  )
}

export default function AssessmentTakePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <ProtectedRoute>
      <AssessmentTakeContent params={params} />
    </ProtectedRoute>
  )
}
