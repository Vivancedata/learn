/**
 * Types for the skill assessment system
 */

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'CODE_OUTPUT'
  | 'FILL_BLANK'

export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface AssessmentQuestion {
  id: string
  question: string
  questionType: QuestionType
  options: string[]
  correctAnswer: string | string[] | number // Can be single answer, multiple answers, or index
  explanation: string
  difficulty: number // 1-5
  points: number
  codeSnippet?: string
}

export interface SkillAssessment {
  id: string
  name: string
  slug: string
  description: string
  courseId?: string
  difficulty: CourseDifficulty
  timeLimit: number // minutes
  passingScore: number // percentage
  totalQuestions: number
  skillArea: string
  questions?: AssessmentQuestion[]
}

export interface AssessmentAttempt {
  id: string
  userId: string
  assessmentId: string
  score: number // percentage
  correctCount: number
  totalCount: number
  timeSpent: number // seconds
  answers: Record<string, string | string[] | number> // questionId -> answer
  passed: boolean
  completedAt: string
  assessment?: SkillAssessment
}

export interface AssessmentWithUserScore extends SkillAssessment {
  userBestScore?: number
  userAttempts?: number
  lastAttemptDate?: string
}

export interface AssessmentStartResponse {
  attemptId: string
  questions: AssessmentQuestion[]
  timeLimit: number
  startedAt: string
}

export interface AssessmentSubmitRequest {
  userId: string
  answers: Record<string, string | string[] | number>
}

export interface AssessmentSubmitResponse {
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
  timeSpent: number
  xpAwarded: number
  questionResults: QuestionResult[]
}

export interface QuestionResult {
  questionId: string
  correct: boolean
  userAnswer: string | string[] | number
  correctAnswer: string | string[] | number
  explanation: string
}

export interface SkillBadge {
  skillArea: string
  level: SkillLevel
  score: number
  earnedAt: string
  assessmentName: string
}

export interface UserSkillProfile {
  userId: string
  skills: SkillBadge[]
  totalAssessments: number
  averageScore: number
}

/**
 * Get skill level based on score percentage
 */
export function getSkillLevel(score: number): SkillLevel {
  if (score >= 95) return 'expert'
  if (score >= 80) return 'advanced'
  if (score >= 50) return 'intermediate'
  return 'beginner'
}

/**
 * Get badge color based on skill level
 */
export function getSkillBadgeColor(level: SkillLevel): string {
  switch (level) {
    case 'expert':
      return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white'
    case 'advanced':
      return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
    case 'intermediate':
      return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
    case 'beginner':
      return 'bg-gradient-to-r from-slate-400 to-gray-500 text-white'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

/**
 * Format time in seconds to human readable format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
