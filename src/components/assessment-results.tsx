'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressCircle } from '@/components/ui/progress-circle'
import { cn } from '@/lib/utils'
import {
  Trophy,
  XCircle,
  CheckCircle,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Share2,
  RotateCcw,
  Award,
  Sparkles,
} from 'lucide-react'
import type { QuestionResult, SkillLevel } from '@/types/assessment'
import { getSkillBadgeColor, formatTime } from '@/types/assessment'

interface AssessmentResultsProps {
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
  passingScore: number
  timeSpent: number
  timeLimit: number
  xpAwarded: number
  skillLevel: SkillLevel
  questionResults: (QuestionResult & {
    question: string
    options: string[]
    questionType: string
  })[]
  assessmentName: string
  onRetake: () => void
  onShare?: () => void
  className?: string
}

export function AssessmentResults({
  score,
  passed,
  correctCount,
  totalCount,
  passingScore,
  timeSpent,
  timeLimit,
  xpAwarded,
  skillLevel,
  questionResults,
  assessmentName,
  onRetake,
  onShare,
  className,
}: AssessmentResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [showAllQuestions, setShowAllQuestions] = useState(false)

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const displayedQuestions = showAllQuestions
    ? questionResults
    : questionResults.slice(0, 5)

  return (
    <div className={cn('space-y-8', className)}>
      {/* Main Results Card */}
      <Card className={cn(
        'overflow-hidden',
        passed && 'border-success/50'
      )}>
        {/* Celebration Header for Passed */}
        {passed && (
          <div className="bg-gradient-to-r from-success/20 via-success/10 to-success/20 px-6 py-4 border-b border-success/20">
            <div className="flex items-center justify-center gap-2 text-success">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="font-semibold">Congratulations! You passed!</span>
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
          </div>
        )}

        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 relative">
            <ProgressCircle
              progress={score}
              size="xl"
              showPercentage
              className="mx-auto"
            />
            {passed && (
              <div className="absolute -bottom-2 -right-2">
                <div className="bg-success text-success-foreground rounded-full p-1.5 shadow-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            )}
          </div>

          <CardTitle className="text-2xl">
            {passed ? 'Assessment Passed!' : 'Assessment Complete'}
          </CardTitle>
          <CardDescription className="text-base">
            {assessmentName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Score Badge */}
          <div className="flex justify-center">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full font-semibold',
              getSkillBadgeColor(skillLevel)
            )}>
              <Award className="h-5 w-5" />
              <span className="capitalize">{skillLevel} Level</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Trophy className="h-5 w-5 text-primary" />
                {score}%
              </div>
              <p className="text-sm text-muted-foreground">Your Score</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Target className="h-5 w-5 text-primary" />
                {passingScore}%
              </div>
              <p className="text-sm text-muted-foreground">Passing Score</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <CheckCircle className="h-5 w-5 text-success" />
                {correctCount}/{totalCount}
              </div>
              <p className="text-sm text-muted-foreground">Correct Answers</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <Clock className="h-5 w-5 text-primary" />
                {formatTime(timeSpent)}
              </div>
              <p className="text-sm text-muted-foreground">
                of {timeLimit} min
              </p>
            </div>
          </div>

          {/* XP Awarded */}
          {xpAwarded > 0 && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">+{xpAwarded} XP earned!</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={onRetake}
              variant={passed ? 'outline' : 'default'}
              className="flex-1 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {passed ? 'Retake Assessment' : 'Try Again'}
            </Button>

            {onShare && (
              <Button
                onClick={onShare}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Result
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Review Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Question Review
            <Badge variant="outline">
              {correctCount} correct, {totalCount - correctCount} incorrect
            </Badge>
          </CardTitle>
          <CardDescription>
            Review your answers and learn from the explanations
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {displayedQuestions.map((result, index) => (
            <QuestionReviewItem
              key={result.questionId}
              result={result}
              questionNumber={index + 1}
              isExpanded={expandedQuestions.has(result.questionId)}
              onToggle={() => toggleQuestion(result.questionId)}
            />
          ))}

          {questionResults.length > 5 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAllQuestions(!showAllQuestions)}
            >
              {showAllQuestions ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show All {questionResults.length} Questions
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface QuestionReviewItemProps {
  result: QuestionResult & {
    question: string
    options: string[]
    questionType: string
  }
  questionNumber: number
  isExpanded: boolean
  onToggle: () => void
}

function QuestionReviewItem({
  result,
  questionNumber,
  isExpanded,
  onToggle,
}: QuestionReviewItemProps) {
  const formatAnswer = (answer: string | string[] | number): string => {
    if (Array.isArray(answer)) {
      return answer.join(', ')
    }
    return String(answer)
  }

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-colors',
        result.correct ? 'border-success/30' : 'border-destructive/30'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          result.correct ? 'bg-success/5 hover:bg-success/10' : 'bg-destructive/5 hover:bg-destructive/10'
        )}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium',
            result.correct ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          )}>
            {result.correct ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </span>
          <div>
            <span className="font-medium">Question {questionNumber}</span>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {result.question}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t bg-card space-y-4">
          <div>
            <h4 className="font-medium mb-2">{result.question}</h4>

            {/* Show options if available */}
            {result.options && result.options.length > 0 && (
              <div className="space-y-2 mb-4">
                {result.options.map((option, i) => {
                  const isUserAnswer = formatAnswer(result.userAnswer) === option ||
                    (Array.isArray(result.userAnswer) && result.userAnswer.includes(option))
                  const isCorrect = formatAnswer(result.correctAnswer) === option ||
                    (Array.isArray(result.correctAnswer) && result.correctAnswer.includes(option))

                  return (
                    <div
                      key={i}
                      className={cn(
                        'p-3 rounded-lg border text-sm',
                        isCorrect && 'bg-success/10 border-success/30 text-success',
                        isUserAnswer && !isCorrect && 'bg-destructive/10 border-destructive/30 text-destructive',
                        !isUserAnswer && !isCorrect && 'bg-muted/50'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {isCorrect && <CheckCircle className="h-4 w-4" />}
                        {isUserAnswer && !isCorrect && <XCircle className="h-4 w-4" />}
                        {option}
                        {isUserAnswer && !isCorrect && (
                          <span className="text-xs">(your answer)</span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* For text input questions */}
            {(!result.options || result.options.length === 0) && (
              <div className="space-y-2 mb-4">
                <div className={cn(
                  'p-3 rounded-lg border',
                  result.correct ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'
                )}>
                  <span className="text-sm text-muted-foreground">Your answer: </span>
                  <span className="font-mono">{formatAnswer(result.userAnswer)}</span>
                </div>
                {!result.correct && (
                  <div className="p-3 rounded-lg border bg-success/10 border-success/30">
                    <span className="text-sm text-muted-foreground">Correct answer: </span>
                    <span className="font-mono text-success">{formatAnswer(result.correctAnswer)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h5 className="font-medium mb-1 text-sm">Explanation</h5>
            <p className="text-sm text-muted-foreground">{result.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface AssessmentResultsSummaryProps {
  score: number
  passed: boolean
  skillLevel: SkillLevel
  className?: string
}

export function AssessmentResultsSummary({
  score,
  passed,
  skillLevel,
  className,
}: AssessmentResultsSummaryProps) {
  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-lg',
      passed ? 'bg-success/10' : 'bg-muted',
      className
    )}>
      <ProgressCircle progress={score} size="md" showPercentage />
      <div>
        <div className="flex items-center gap-2">
          {passed ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <span className="font-medium">{passed ? 'Passed' : 'Not Passed'}</span>
        </div>
        <div className={cn(
          'text-sm mt-1 inline-block px-2 py-0.5 rounded-full',
          getSkillBadgeColor(skillLevel)
        )}>
          {skillLevel} level
        </div>
      </div>
    </div>
  )
}
