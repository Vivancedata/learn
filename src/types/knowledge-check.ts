export interface Question {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface KnowledgeCheckProps {
  questions: Question[]
  onComplete?: (score: number) => void
}

export interface QuizResult {
  score: number
  correctAnswers: number
  totalQuestions: number
  answeredQuestions: number[]
  selectedAnswers: number[]
}
