'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AssessmentQuestion } from '@/components/assessment-question'
import { AssessmentTimer } from '@/components/assessment-timer'
import { AssessmentNavigation, AssessmentNavigationCompact, QuestionStatus } from '@/components/assessment-navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssessmentQuestion as AssessmentQuestionType } from '@/types/assessment'

interface AssessmentStartResponse {
  data: {
    attemptId: string
    assessmentId: string
    assessmentSlug: string
    name: string
    timeLimit: number
    passingScore: number
    totalQuestions: number
    startedAt: string
    questions: (Omit<AssessmentQuestionType, 'correctAnswer'> & { correctAnswer: undefined })[]
  }
}

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

function AssessmentTakeContent({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [assessmentData, setAssessmentData] = useState<AssessmentStartResponse['data'] | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  // Refs for tracking time and preventing duplicate submissions
  const submittedRef = useRef(false)
  const startTimeRef = useRef<number | null>(null)

  // Warn user before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (assessmentData && !submittedRef.current) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [assessmentData])

  // Start assessment
  const startAssessment = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

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
      setAssessmentData(data.data)
      startTimeRef.current = Date.now()
    } catch (_err) {
      setError('Failed to start assessment. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [slug, user?.id])

  useEffect(() => {
    startAssessment()
  }, [startAssessment])

  // Submit assessment
  const submitAssessment = useCallback(async () => {
    if (!user?.id || !assessmentData || submittedRef.current || isSubmitting) return

    submittedRef.current = true
    setIsSubmitting(true)
    setShowSubmitModal(false)

    // Calculate time spent
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
          userId: user.id,
          answers,
          timeSpent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit assessment')
      }

      const data: SubmitResponse = await response.json()

      // Store results in sessionStorage for the results page
      sessionStorage.setItem(
        `assessment-results-${slug}`,
        JSON.stringify({
          ...data.data,
          assessmentName: assessmentData.name,
          timeLimit: assessmentData.timeLimit,
          questions: assessmentData.questions,
          timeSpent,
        })
      )

      // Navigate to results page
      router.push(`/assessments/${slug}/results`)
    } catch (_err) {
      submittedRef.current = false
      setIsSubmitting(false)
      setError('Failed to submit assessment. Please try again.')
    }
  }, [user?.id, assessmentData, answers, slug, router, isSubmitting])

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (!submittedRef.current) {
      submitAssessment()
    }
  }, [submitAssessment])

  // Handle answer change
  const handleAnswerChange = (answer: string | string[] | number) => {
    if (!assessmentData) return
    const questionId = assessmentData.questions[currentQuestionIndex].id
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  // Handle flag toggle
  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex)
      } else {
        newSet.add(currentQuestionIndex)
      }
      return newSet
    })
  }

  // Navigation
  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    setShowSidebar(false)
  }

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const goToNext = () => {
    if (assessmentData && currentQuestionIndex < assessmentData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // Get question statuses for navigation
  const getQuestionStatuses = (): QuestionStatus[] => {
    if (!assessmentData) return []

    return assessmentData.questions.map((q, index) => {
      if (index === currentQuestionIndex) return 'current'
      if (flaggedQuestions.has(index)) return 'flagged'
      if (answers[q.id] !== undefined) return 'answered'
      return 'unanswered'
    })
  }

  const answeredCount = assessmentData
    ? Object.keys(answers).length
    : 0

  const unansweredCount = assessmentData
    ? assessmentData.questions.length - answeredCount
    : 0

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading assessment...</p>
      </div>
    )
  }

  if (error || !assessmentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Assessment</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/assessments/${slug}`)}>
            Go Back
          </Button>
          <Button onClick={startAssessment}>Try Again</Button>
        </div>
      </div>
    )
  }

  const currentQuestion = assessmentData.questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion.id]

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold text-lg hidden sm:block truncate max-w-xs">
                {assessmentData.name}
              </h1>
              <AssessmentNavigationCompact
                totalQuestions={assessmentData.questions.length}
                currentQuestion={currentQuestionIndex}
                answeredCount={answeredCount}
                flaggedCount={flaggedQuestions.size}
                className="hidden md:block"
              />
            </div>

            <div className="flex items-center gap-3">
              <AssessmentTimer
                timeLimit={assessmentData.timeLimit}
                startedAt={assessmentData.startedAt}
                onTimeUp={handleTimeUp}
              />

              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setShowSidebar(true)}
              >
                Questions
              </Button>

              <Button
                onClick={() => setShowSubmitModal(true)}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Submit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <AssessmentQuestion
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={assessmentData.questions.length}
                  selectedAnswer={currentAnswer}
                  onAnswerChange={handleAnswerChange}
                />

                {/* Flag for Review */}
                <div className="mt-6 pt-6 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flaggedQuestions.has(currentQuestionIndex)}
                      onChange={toggleFlag}
                      className="w-4 h-4 rounded border-input accent-warning"
                    />
                    <Flag className={cn(
                      'h-4 w-4',
                      flaggedQuestions.has(currentQuestionIndex) ? 'text-warning' : 'text-muted-foreground'
                    )} />
                    <span className="text-sm">Flag for review</span>
                  </label>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {assessmentData.questions.length}
                  </span>

                  {currentQuestionIndex === assessmentData.questions.length - 1 ? (
                    <Button
                      onClick={() => setShowSubmitModal(true)}
                      className="gap-2"
                    >
                      Submit
                      <Send className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={goToNext}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Sidebar - Question Navigation */}
          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <h3 className="font-semibold">Questions</h3>
              </CardHeader>
              <CardContent>
                <AssessmentNavigation
                  totalQuestions={assessmentData.questions.length}
                  currentQuestion={currentQuestionIndex}
                  questionStatuses={getQuestionStatuses()}
                  onQuestionClick={goToQuestion}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-card border-l shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Questions</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
              <AssessmentNavigation
                totalQuestions={assessmentData.questions.length}
                currentQuestion={currentQuestionIndex}
                questionStatuses={getQuestionStatuses()}
                onQuestionClick={goToQuestion}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSubmitModal(false)}
          />
          <Card className="relative w-full max-w-md">
            <CardHeader>
              <h2 className="text-xl font-semibold">Submit Assessment?</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Questions Answered</span>
                  <span className="font-medium">{answeredCount} / {assessmentData.questions.length}</span>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
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
                {flaggedQuestions.size > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flag className="h-4 w-4 text-warning" />
                    <span>{flaggedQuestions.size} question{flaggedQuestions.size !== 1 ? 's' : ''} flagged for review</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1"
                >
                  Review Answers
                </Button>
                <Button
                  onClick={submitAssessment}
                  disabled={isSubmitting}
                  className="flex-1 gap-2"
                >
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
      )}

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Submitting your assessment...</p>
            <p className="text-muted-foreground">Please wait</p>
          </div>
        </div>
      )}
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
