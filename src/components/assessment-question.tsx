'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { AssessmentQuestion as AssessmentQuestionType, QuestionType } from '@/types/assessment'
import { CheckCircle, Circle, Square, CheckSquare, Code } from 'lucide-react'

interface AssessmentQuestionProps {
  question: Omit<AssessmentQuestionType, 'correctAnswer'> & { correctAnswer: undefined }
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | string[] | number | undefined
  onAnswerChange: (answer: string | string[] | number) => void
  disabled?: boolean
  showResult?: boolean
  isCorrect?: boolean
  correctAnswer?: string | string[] | number
}

export function AssessmentQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerChange,
  disabled = false,
  showResult = false,
  isCorrect,
  correctAnswer,
}: AssessmentQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {questionNumber} of {totalQuestions}</span>
        <span className="font-medium text-primary">{question.points} points</span>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-relaxed">{question.question}</h3>

        {question.codeSnippet && (
          <div className="relative">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Code className="h-3 w-3" />
              Code
            </div>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        <QuestionInput
          questionType={question.questionType}
          options={question.options}
          selectedAnswer={selectedAnswer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          showResult={showResult}
          isCorrect={isCorrect}
          correctAnswer={correctAnswer}
        />
      </div>
    </div>
  )
}

interface QuestionInputProps {
  questionType: QuestionType
  options: string[]
  selectedAnswer: string | string[] | number | undefined
  onAnswerChange: (answer: string | string[] | number) => void
  disabled?: boolean
  showResult?: boolean
  isCorrect?: boolean
  correctAnswer?: string | string[] | number
}

function QuestionInput({
  questionType,
  options,
  selectedAnswer,
  onAnswerChange,
  disabled,
  showResult,
  isCorrect,
  correctAnswer,
}: QuestionInputProps) {
  switch (questionType) {
    case 'SINGLE_CHOICE':
    case 'TRUE_FALSE':
      return (
        <SingleChoiceInput
          options={options}
          selectedAnswer={selectedAnswer as string | undefined}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          showResult={showResult}
          isCorrect={isCorrect}
          correctAnswer={correctAnswer as string | undefined}
        />
      )
    case 'MULTIPLE_CHOICE':
      return (
        <MultipleChoiceInput
          options={options}
          selectedAnswers={(selectedAnswer as string[] | undefined) || []}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          showResult={showResult}
          isCorrect={isCorrect}
          correctAnswers={correctAnswer as string[] | undefined}
        />
      )
    case 'CODE_OUTPUT':
    case 'FILL_BLANK':
      return (
        <TextInput
          value={(selectedAnswer as string | undefined) || ''}
          onChange={(value) => onAnswerChange(value)}
          placeholder={questionType === 'CODE_OUTPUT' ? 'Enter the output...' : 'Enter your answer...'}
          disabled={disabled}
          showResult={showResult}
          isCorrect={isCorrect}
          correctAnswer={correctAnswer as string | undefined}
        />
      )
    default:
      return null
  }
}

interface SingleChoiceInputProps {
  options: string[]
  selectedAnswer: string | undefined
  onAnswerChange: (answer: string) => void
  disabled?: boolean
  showResult?: boolean
  isCorrect?: boolean
  correctAnswer?: string
}

function SingleChoiceInput({
  options,
  selectedAnswer,
  onAnswerChange,
  disabled,
  showResult,
  isCorrect,
  correctAnswer,
}: SingleChoiceInputProps) {
  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option
        const isCorrectAnswer = showResult && correctAnswer === option
        const isWrongSelected = showResult && isSelected && !isCorrect

        return (
          <button
            key={index}
            type="button"
            onClick={() => onAnswerChange(option)}
            disabled={disabled}
            className={cn(
              'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
              'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
              isSelected && !showResult && 'border-primary bg-primary/5',
              isCorrectAnswer && 'border-success bg-success/10',
              isWrongSelected && 'border-destructive bg-destructive/10',
              disabled && 'cursor-not-allowed opacity-60',
              !isSelected && !showResult && 'border-border'
            )}
          >
            <span className="flex-shrink-0 mt-0.5">
              {isCorrectAnswer ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : isWrongSelected ? (
                <Circle className="h-5 w-5 text-destructive fill-destructive" />
              ) : isSelected ? (
                <Circle className="h-5 w-5 text-primary fill-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span className={cn(
              'flex-1',
              isCorrectAnswer && 'text-success font-medium',
              isWrongSelected && 'text-destructive'
            )}>
              {option}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface MultipleChoiceInputProps {
  options: string[]
  selectedAnswers: string[]
  onAnswerChange: (answers: string[]) => void
  disabled?: boolean
  showResult?: boolean
  isCorrect?: boolean
  correctAnswers?: string[]
}

function MultipleChoiceInput({
  options,
  selectedAnswers,
  onAnswerChange,
  disabled,
  showResult,
  isCorrect,
  correctAnswers = [],
}: MultipleChoiceInputProps) {
  const toggleOption = (option: string) => {
    if (selectedAnswers.includes(option)) {
      onAnswerChange(selectedAnswers.filter(a => a !== option))
    } else {
      onAnswerChange([...selectedAnswers, option])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
      {options.map((option, index) => {
        const isSelected = selectedAnswers.includes(option)
        const isCorrectAnswer = showResult && correctAnswers.includes(option)
        const isWrongSelected = showResult && isSelected && !correctAnswers.includes(option)
        const isMissed = showResult && correctAnswers.includes(option) && !isSelected

        return (
          <button
            key={index}
            type="button"
            onClick={() => toggleOption(option)}
            disabled={disabled}
            className={cn(
              'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
              'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
              isSelected && !showResult && 'border-primary bg-primary/5',
              isCorrectAnswer && isSelected && 'border-success bg-success/10',
              isWrongSelected && 'border-destructive bg-destructive/10',
              isMissed && 'border-warning bg-warning/10',
              disabled && 'cursor-not-allowed opacity-60',
              !isSelected && !showResult && 'border-border'
            )}
          >
            <span className="flex-shrink-0 mt-0.5">
              {isCorrectAnswer && isSelected ? (
                <CheckSquare className="h-5 w-5 text-success" />
              ) : isWrongSelected ? (
                <CheckSquare className="h-5 w-5 text-destructive" />
              ) : isMissed ? (
                <Square className="h-5 w-5 text-warning" />
              ) : isSelected ? (
                <CheckSquare className="h-5 w-5 text-primary" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span className={cn(
              'flex-1',
              isCorrectAnswer && isSelected && 'text-success font-medium',
              isWrongSelected && 'text-destructive',
              isMissed && 'text-warning'
            )}>
              {option}
              {isMissed && <span className="ml-2 text-xs">(missed)</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  showResult?: boolean
  isCorrect?: boolean
  correctAnswer?: string
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  showResult,
  isCorrect,
  correctAnswer,
}: TextInputProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 rounded-lg border bg-background transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          showResult && isCorrect && 'border-success bg-success/10',
          showResult && !isCorrect && 'border-destructive bg-destructive/10',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      />
      {showResult && !isCorrect && correctAnswer && (
        <p className="text-sm text-success">
          Correct answer: <span className="font-mono font-medium">{correctAnswer}</span>
        </p>
      )}
    </div>
  )
}
