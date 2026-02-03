'use client'

import { cn } from '@/lib/utils'
import { Flag, Check } from 'lucide-react'

export type QuestionStatus = 'unanswered' | 'answered' | 'flagged' | 'current'

interface AssessmentNavigationProps {
  totalQuestions: number
  currentQuestion: number
  questionStatuses: QuestionStatus[]
  onQuestionClick: (index: number) => void
  className?: string
}

export function AssessmentNavigation({
  totalQuestions,
  currentQuestion,
  questionStatuses,
  onQuestionClick,
  className,
}: AssessmentNavigationProps) {
  return (
    <nav
      className={cn('space-y-4', className)}
      aria-label="Question navigation"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Questions</span>
        <span>
          {questionStatuses.filter((s) => s === 'answered').length} / {totalQuestions} answered
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="list">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const status = questionStatuses[index] || 'unanswered'
          const isCurrent = index === currentQuestion
          const isAnswered = status === 'answered'
          const isFlagged = status === 'flagged'

          return (
            <button
              key={index}
              onClick={() => onQuestionClick(index)}
              className={cn(
                'relative w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                'hover:scale-105 active:scale-95',
                // Default unanswered state
                !isCurrent && !isAnswered && !isFlagged && 'bg-muted text-muted-foreground hover:bg-muted/80',
                // Answered state
                isAnswered && !isCurrent && 'bg-success/20 text-success border border-success/50',
                // Flagged state
                isFlagged && !isCurrent && 'bg-warning/20 text-warning border border-warning/50',
                // Current state
                isCurrent && 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/30'
              )}
              aria-label={`Question ${index + 1}${isCurrent ? ', current' : ''}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged for review' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
              role="listitem"
            >
              <span>{index + 1}</span>
              {isFlagged && (
                <Flag
                  className="absolute -top-1 -right-1 h-3 w-3 text-warning"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-success/20 border border-success/50" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-warning/20 border border-warning/50 relative">
            <Flag className="absolute -top-0.5 -right-0.5 h-2 w-2 text-warning" />
          </div>
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Current</span>
        </div>
      </div>
    </nav>
  )
}

interface AssessmentNavigationCompactProps {
  totalQuestions: number
  currentQuestion: number
  answeredCount: number
  flaggedCount: number
  className?: string
}

export function AssessmentNavigationCompact({
  totalQuestions,
  currentQuestion,
  answeredCount,
  flaggedCount,
  className,
}: AssessmentNavigationCompactProps) {
  const progress = (answeredCount / totalQuestions) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Question {currentQuestion + 1} of {totalQuestions}
        </span>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="h-4 w-4 text-success" />
            {answeredCount}
          </span>
          {flaggedCount > 0 && (
            <span className="flex items-center gap-1">
              <Flag className="h-4 w-4 text-warning" />
              {flaggedCount}
            </span>
          )}
        </div>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-label={`${answeredCount} of ${totalQuestions} questions answered`}
        />
      </div>
    </div>
  )
}
