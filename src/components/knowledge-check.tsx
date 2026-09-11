"use client"

import { useId, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, HelpCircle, AlertTriangle } from "lucide-react"

import { KnowledgeCheckProps } from "@/types/knowledge-check"

export function KnowledgeCheck({ questions, onComplete }: KnowledgeCheckProps) {
  const groupId = useId()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(Array(questions.length).fill(-1))
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const handleSelectAnswer = (optionIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers]
    newSelectedAnswers[currentQuestion] = optionIndex
    setSelectedAnswers(newSelectedAnswers)
  }

  const handleNextQuestion = () => {
    setShowExplanation(false)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setQuizCompleted(true)

      const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
        return answer === questions[index].correctAnswer ? count + 1 : count
      }, 0)

      const score = Math.round((correctAnswers / questions.length) * 100)

      if (onComplete) {
        onComplete({ score, selectedAnswers })
      }
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setShowExplanation(false)
    }
  }

  const handleCheckAnswer = () => {
    if (selectedAnswers[currentQuestion] === -1) return
    setShowExplanation(true)
  }

  const handleRetry = () => {
    setSelectedAnswers(Array(questions.length).fill(-1))
    setCurrentQuestion(0)
    setShowExplanation(false)
    setQuizCompleted(false)
  }

  const correctAnswers = selectedAnswers.reduce((count, answer, index) => {
    return answer === questions[index].correctAnswer ? count + 1 : count
  }, 0)

  const score = Math.round((correctAnswers / questions.length) * 100)

  const question = questions[currentQuestion]
  const selectedAnswer = selectedAnswers[currentQuestion]
  const isCorrect = selectedAnswer === question.correctAnswer

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
          Knowledge Check
        </CardTitle>
        <CardDescription>
          Test your understanding of the concepts covered in this lesson
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!quizCompleted ? (
          <div className="space-y-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{selectedAnswers.filter(a => a !== -1).length} answered</span>
            </div>

            <div className="space-y-4">
              {/* Native radios in a fieldset: arrow keys, Space, Tab and every
                  assistive technology get the behaviour for free. This was a
                  set of div+onClick with no role and no tabIndex, unreachable
                  without a mouse. */}
              <fieldset className="space-y-2 border-0 p-0 m-0">
                <legend className="text-lg font-medium mb-2">{question.question}</legend>

                {question.options.map((option, index) => {
                  const optionId = `${groupId}-q${currentQuestion}-o${index}`
                  const isSelected = selectedAnswer === index
                  const isAnswer = index === question.correctAnswer

                  return (
                    <label
                      key={index}
                      htmlFor={optionId}
                      className={`
                        flex items-start gap-3 p-3 rounded-md border transition-colors
                        focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
                        ${isSelected ? 'border-brand' : 'border-border'}
                        ${showExplanation && isAnswer ? 'bg-success/10 border-success' : ''}
                        ${showExplanation && isSelected && !isCorrect ? 'bg-destructive/10 border-destructive' : ''}
                        ${showExplanation ? 'cursor-default' : 'cursor-pointer hover:bg-muted'}
                      `}
                    >
                      <input
                        type="radio"
                        id={optionId}
                        name={`${groupId}-q${currentQuestion}`}
                        value={index}
                        checked={isSelected}
                        onChange={() => handleSelectAnswer(index)}
                        disabled={showExplanation}
                        // The wrapping label carries the ring token via focus-within, so the
                        // native outline would double it in the UA's own blue.
                        className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--brand))] outline-none disabled:opacity-100"
                      />
                      <span className="flex-1">{option}</span>
                      {showExplanation && isAnswer && (
                        <CheckCircle className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                      )}
                      {showExplanation && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                      )}
                    </label>
                  )
                })}
              </fieldset>

              {/* The result is announced, not just coloured. The region is
                  always mounted so screen readers pick up the change. */}
              <div aria-live="polite" className="empty:hidden">
                {showExplanation && (
                  <div
                    className={`p-4 rounded-md border ${
                      isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'
                    }`}
                  >
                    <p className="font-medium">{isCorrect ? 'Correct.' : 'Not quite.'}</p>
                    {/* The stored explanation usually already names the answer;
                        only spell it out when there is no explanation. */}
                    <p className="text-sm text-muted-foreground mt-1">
                      {question.explanation ??
                        `The answer is: ${question.options[question.correctAnswer]}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This answer is locked. Continue to the next question below.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              className="flex flex-col items-center justify-center py-6"
              aria-live="polite"
            >
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <p className="text-muted-foreground">
                You got {correctAnswers} out of {questions.length} questions correct
              </p>

              {score >= 80 ? (
                <div className="flex items-center gap-2 text-success mt-4">
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  <span>Great job! You&apos;ve mastered this content.</span>
                </div>
              ) : score >= 60 ? (
                <div className="flex items-center gap-2 text-warning mt-4">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  <span>Good effort! Review the material and try again.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive mt-4">
                  <XCircle className="h-5 w-5" aria-hidden="true" />
                  <span>You might need to revisit the lesson content.</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Question Summary</h3>
              <ul className="space-y-2">
                {questions.map((q, index) => {
                  const right = selectedAnswers[index] === q.correctAnswer
                  return (
                    <li key={index} className="flex items-center gap-2">
                      {right ? (
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" aria-hidden="true" />
                      )}
                      <span className="sr-only">{right ? 'Correct:' : 'Incorrect:'}</span>
                      <span className="text-sm truncate">{q.question}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {!quizCompleted ? (
          <>
            <Button
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            <div>
              {!showExplanation ? (
                <Button
                  onClick={handleCheckAnswer}
                  disabled={selectedAnswer === -1}
                >
                  Check Answer
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <Button onClick={handleRetry}>Retry Quiz</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
