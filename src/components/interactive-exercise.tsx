'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { CodePlayground, type TestCase } from '@/components/code-playground'
import {
  ChevronDown,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trophy,
  BookOpen,
} from 'lucide-react'

export interface Exercise {
  /** Unique identifier for the exercise */
  id: string
  /** Title of the exercise */
  title: string
  /** Description/instructions for the exercise (supports markdown) */
  instructions: string
  /** Starter code provided to the student */
  starterCode: string
  /** Solution code (optional, for hint progression) */
  solutionCode?: string
  /** Test cases to validate the solution */
  tests?: TestCase[]
  /** Expected output for simple validation */
  expectedOutput?: string
  /** Progressive hints */
  hints?: string[]
  /** Difficulty level */
  difficulty?: 'easy' | 'medium' | 'hard'
  /** Estimated time to complete in minutes */
  estimatedTime?: number
}

export interface InteractiveExerciseProps {
  /** The exercise configuration */
  exercise: Exercise
  /** Lesson ID for progress tracking */
  lessonId?: string
  /** Callback when exercise is completed successfully */
  onComplete?: (exerciseId: string) => void
  /** Whether the exercise has been completed before */
  isCompleted?: boolean
  /** Additional CSS classes */
  className?: string
}

type ExerciseState = 'working' | 'success' | 'failed'

/**
 * InteractiveExercise - A complete exercise wrapper with instructions, hints, and validation
 *
 * Features:
 * - Instructions panel with markdown support
 * - Code playground with test validation
 * - Progressive hints system (reveal one at a time)
 * - Success/failure feedback with animations
 * - Optional solution reveal
 * - Progress tracking integration
 */
export function InteractiveExercise({
  exercise,
  lessonId,
  onComplete,
  isCompleted: initiallyCompleted = false,
  className,
}: InteractiveExerciseProps) {
  const [state, setState] = useState<ExerciseState>(initiallyCompleted ? 'success' : 'working')
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [instructionsExpanded, setInstructionsExpanded] = useState(true)
  const [attempts, setAttempts] = useState(0)

  // Handle successful code execution
  const handleSuccess = useCallback(() => {
    setState('success')
    onComplete?.(exercise.id)
  }, [exercise.id, onComplete])

  // Handle failed code execution
  const handleError = useCallback(() => {
    setState('failed')
    setAttempts((prev) => prev + 1)
  }, [])

  // Reveal next hint
  const revealNextHint = useCallback(() => {
    if (exercise.hints && hintsRevealed < exercise.hints.length) {
      setHintsRevealed((prev) => prev + 1)
    }
  }, [exercise.hints, hintsRevealed])

  // Reset exercise
  const resetExercise = useCallback(() => {
    setState('working')
    setHintsRevealed(0)
    setShowSolution(false)
    setAttempts(0)
  }, [])

  // Toggle solution visibility
  const toggleSolution = useCallback(() => {
    setShowSolution((prev) => !prev)
  }, [])

  const hasHints = exercise.hints && exercise.hints.length > 0
  const allHintsRevealed = hasHints && hintsRevealed >= exercise.hints!.length
  const hasSolution = !!exercise.solutionCode

  // Difficulty badge colors
  const difficultyColors = {
    easy: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    hard: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Exercise Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {state === 'success' ? (
                  <Trophy className="h-5 w-5 text-success" />
                ) : (
                  <BookOpen className="h-5 w-5 text-primary" />
                )}
                <CardTitle className="text-lg">{exercise.title}</CardTitle>
              </div>
              {(exercise.difficulty || exercise.estimatedTime) && (
                <div className="flex items-center gap-2 text-sm">
                  {exercise.difficulty && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium border',
                        difficultyColors[exercise.difficulty]
                      )}
                    >
                      {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                    </span>
                  )}
                  {exercise.estimatedTime && (
                    <span className="text-muted-foreground">
                      ~{exercise.estimatedTime} min
                    </span>
                  )}
                </div>
              )}
            </div>

            {state === 'success' && (
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Instructions Panel */}
      <Card>
        <button
          onClick={() => setInstructionsExpanded(!instructionsExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-medium">
            {instructionsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            Instructions
          </div>
          {!instructionsExpanded && (
            <span className="text-xs text-muted-foreground">Click to expand</span>
          )}
        </button>

        {instructionsExpanded && (
          <CardContent className="pt-0 pb-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: formatInstructions(exercise.instructions) }}
            />
          </CardContent>
        )}
      </Card>

      {/* Code Playground */}
      <CodePlayground
        initialCode={showSolution && exercise.solutionCode ? exercise.solutionCode : exercise.starterCode}
        testCases={exercise.tests}
        expectedOutput={exercise.expectedOutput}
        lessonId={lessonId}
        onSuccess={handleSuccess}
        onError={handleError}
        readOnly={showSolution}
        title={showSolution ? 'Solution' : 'Your Code'}
        description={showSolution ? 'This is one possible solution. Try to understand how it works!' : undefined}
      />

      {/* Feedback Messages */}
      {state === 'success' && (
        <Alert variant="success" className="animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Excellent work!</AlertTitle>
          <AlertDescription>
            You have successfully completed this exercise.
            {attempts > 1 && ` It took you ${attempts} attempts.`}
          </AlertDescription>
        </Alert>
      )}

      {state === 'failed' && attempts >= 3 && (
        <Alert variant="warning">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Keep trying!</AlertTitle>
          <AlertDescription>
            You have made {attempts} attempts. Consider revealing a hint or reviewing the instructions.
          </AlertDescription>
        </Alert>
      )}

      {/* Hints Section */}
      {hasHints && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Hints
              </CardTitle>
              <CardDescription>
                {hintsRevealed} / {exercise.hints!.length} revealed
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Revealed hints */}
            {exercise.hints!.slice(0, hintsRevealed).map((hint, index) => (
              <div
                key={index}
                className="p-3 bg-warning/5 border border-warning/20 rounded-lg text-sm animate-fade-in"
              >
                <span className="font-medium text-warning">Hint {index + 1}:</span>{' '}
                {hint}
              </div>
            ))}

            {/* Reveal hint button */}
            {!allHintsRevealed && (
              <Button
                variant="outline"
                size="sm"
                onClick={revealNextHint}
                className="gap-1.5"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Reveal Hint {hintsRevealed + 1}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetExercise}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Exercise
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Show/Hide Solution Button */}
          {hasSolution && (
            <Button
              variant={showSolution ? 'secondary' : 'outline'}
              size="sm"
              onClick={toggleSolution}
              className="gap-1.5"
            >
              {showSolution ? (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Hide Solution
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Show Solution
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Format instructions text with basic markdown-like formatting
 */
function formatInstructions(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg overflow-x-auto"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

/**
 * A simpler exercise card for quick practice
 */
export function QuickExercise({
  title,
  description,
  code,
  expectedOutput,
  hint,
  className,
}: {
  title: string
  description: string
  code: string
  expectedOutput?: string
  hint?: string
  className?: string
}) {
  const [showHint, setShowHint] = useState(false)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <CodePlayground
          initialCode={code}
          expectedOutput={expectedOutput}
          editorMinHeight="150px"
        />

        {hint && (
          <div>
            {!showHint ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(true)}
                className="text-muted-foreground"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                Need a hint?
              </Button>
            ) : (
              <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg text-sm">
                <span className="font-medium text-warning">Hint:</span> {hint}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Collection of exercises for a lesson
 */
export function ExerciseList({
  exercises,
  lessonId,
  completedExercises = [],
  onExerciseComplete,
  className,
}: {
  exercises: Exercise[]
  lessonId?: string
  completedExercises?: string[]
  onExerciseComplete?: (exerciseId: string) => void
  className?: string
}) {
  return (
    <div className={cn('space-y-8', className)}>
      {exercises.map((exercise, index) => (
        <div key={exercise.id}>
          <div className="text-sm text-muted-foreground mb-2">
            Exercise {index + 1} of {exercises.length}
          </div>
          <InteractiveExercise
            exercise={exercise}
            lessonId={lessonId}
            isCompleted={completedExercises.includes(exercise.id)}
            onComplete={onExerciseComplete}
          />
        </div>
      ))}
    </div>
  )
}
