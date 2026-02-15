"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, HelpCircle, AlertTriangle } from "lucide-react"

import { KnowledgeCheckProps } from "@/types/knowledge-check"

export function KnowledgeCheck({ questions, onComplete }: KnowledgeCheckProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(Array(questions.length).fill(-1))
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  
  const handleSelectAnswer = (optionIndex: number) => {
    if (showExplanation || quizCompleted) return
    
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
      
      // Calculate score
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
  
  // Calculate score for results screen
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
          <HelpCircle className="h-5 w-5" />
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
              <h3 className="text-lg font-medium">{question.question}</h3>
              
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={`
                      p-3 rounded-md border cursor-pointer transition-colors
                      ${selectedAnswer === index ? 'border-primary' : 'border-border'}
                      ${showExplanation && index === question.correctAnswer ? 'bg-success/10 border-success' : ''}
                      ${showExplanation && selectedAnswer === index && !isCorrect ? 'bg-destructive/10 border-destructive' : ''}
                      ${!showExplanation && selectedAnswer !== index ? 'hover:bg-muted' : ''}
                    `}
                    onClick={() => handleSelectAnswer(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {showExplanation && index === question.correctAnswer ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : showExplanation && selectedAnswer === index && !isCorrect ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedAnswer === index ? 'border-primary bg-primary/10' : 'border-muted-foreground'}`}>
                            {selectedAnswer === index && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                        )}
                      </div>
                      <div>{option}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {showExplanation && question.explanation && (
                <div className="bg-muted p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-1">Explanation</h4>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <p className="text-muted-foreground">
                You got {correctAnswers} out of {questions.length} questions correct
              </p>
              
              {score >= 80 ? (
                <div className="flex items-center gap-2 text-success mt-4">
                  <CheckCircle className="h-5 w-5" />
                  <span>Great job! You&apos;ve mastered this content.</span>
                </div>
              ) : score >= 60 ? (
                <div className="flex items-center gap-2 text-warning mt-4">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Good effort! Review the material and try again.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive mt-4">
                  <XCircle className="h-5 w-5" />
                <span>You might need to revisit the lesson content.</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Question Summary</h3>
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {selectedAnswers[index] === q.correctAnswer ? (
                      <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">{q.question}</span>
                  </div>
                ))}
              </div>
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
