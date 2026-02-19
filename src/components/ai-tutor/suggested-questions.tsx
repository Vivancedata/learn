'use client'

import { memo } from 'react'
import { HelpCircle, Lightbulb, Code, ArrowRight, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SuggestedQuestion } from '@/types/ai-tutor'

interface SuggestedQuestionsProps {
  questions: SuggestedQuestion[]
  onQuestionClick: (text: string) => void
  isLoading?: boolean
  variant?: 'default' | 'compact'
  className?: string
}

/**
 * Get the appropriate icon for a question category
 */
function getIcon(icon: string | undefined) {
  switch (icon) {
    case 'help':
      return HelpCircle
    case 'lightbulb':
      return Lightbulb
    case 'code':
      return Code
    case 'arrow-right':
      return ArrowRight
    default:
      return MessageSquare
  }
}

/**
 * Get category color classes
 */
function getCategoryClasses(category: SuggestedQuestion['category']): string {
  switch (category) {
    case 'understanding':
      return 'border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5'
    case 'practice':
      return 'border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5'
    case 'example':
      return 'border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5'
    case 'navigation':
      return 'border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5'
    default:
      return 'border-border hover:border-primary/40 hover:bg-primary/5'
  }
}

/**
 * Get icon color classes
 */
function getIconClasses(category: SuggestedQuestion['category']): string {
  switch (category) {
    case 'understanding':
      return 'text-blue-500'
    case 'practice':
      return 'text-green-500'
    case 'example':
      return 'text-purple-500'
    case 'navigation':
      return 'text-orange-500'
    default:
      return 'text-muted-foreground'
  }
}

/**
 * SuggestedQuestions component
 * Displays context-aware suggested questions for the user
 */
function SuggestedQuestionsComponent({
  questions,
  onQuestionClick,
  isLoading = false,
  variant = 'default',
  className,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) {
    return null
  }

  const isCompact = variant === 'compact'

  return (
    <div
      className={cn('space-y-2', className)}
      role="region"
      aria-label="Suggested questions"
    >
      {!isCompact && (
        <p className="text-xs text-muted-foreground font-medium px-1">
          Suggested questions
        </p>
      )}
      <div
        className={cn(
          'flex gap-2',
          isCompact ? 'flex-row flex-wrap' : 'flex-col'
        )}
      >
        {questions.map((question) => {
          const Icon = getIcon(question.icon)
          const categoryClasses = getCategoryClasses(question.category)
          const iconClasses = getIconClasses(question.category)

          if (isCompact) {
            return (
              <Button
                key={question.id}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'text-xs h-auto py-1.5 px-3 rounded-full transition-all duration-200',
                  categoryClasses
                )}
                onClick={() => onQuestionClick(question.text)}
                disabled={isLoading}
              >
                <Icon className={cn('w-3 h-3 mr-1.5 flex-shrink-0', iconClasses)} aria-hidden="true" />
                <span className="truncate">{question.text}</span>
              </Button>
            )
          }

          return (
            <button
              key={question.id}
              type="button"
              className={cn(
                'group flex items-start gap-3 w-full p-3 rounded-lg border text-left',
                'transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                categoryClasses
              )}
              onClick={() => onQuestionClick(question.text)}
              disabled={isLoading}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  'bg-background border transition-colors',
                  categoryClasses
                )}
              >
                <Icon className={cn('w-4 h-4', iconClasses)} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {question.text}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {question.category}
                </p>
              </div>
              <ArrowRight
                className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Memoized SuggestedQuestions component
 */
export const SuggestedQuestions = memo(SuggestedQuestionsComponent)
SuggestedQuestions.displayName = 'SuggestedQuestions'

/**
 * Welcome message with suggested questions for new conversations
 */
interface WelcomeMessageProps {
  lessonTitle?: string
  courseName?: string
  onQuestionClick: (text: string) => void
  isLoading?: boolean
}

export function WelcomeMessage({
  lessonTitle,
  courseName,
  onQuestionClick,
  isLoading,
}: WelcomeMessageProps) {
  const defaultQuestions: SuggestedQuestion[] = [
    {
      id: 'understand',
      text: lessonTitle
        ? `Help me understand ${lessonTitle}`
        : 'Help me understand this concept',
      category: 'understanding',
      icon: 'help',
    },
    {
      id: 'practice',
      text: 'Give me a practice problem',
      category: 'practice',
      icon: 'code',
    },
    {
      id: 'example',
      text: 'Show me a practical example',
      category: 'example',
      icon: 'lightbulb',
    },
    {
      id: 'next',
      text: 'What should I learn next?',
      category: 'navigation',
      icon: 'arrow-right',
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
        <MessageSquare className="w-8 h-8 text-primary-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Hi! I&apos;m your AI Tutor</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {lessonTitle
            ? `I'm here to help you learn ${lessonTitle}. Ask me anything!`
            : courseName
            ? `I'm here to help you with ${courseName}. Ask me anything!`
            : "I'm here to help you learn. Ask me anything about your course!"}
        </p>
      </div>
      <SuggestedQuestions
        questions={defaultQuestions}
        onQuestionClick={onQuestionClick}
        isLoading={isLoading}
      />
    </div>
  )
}
