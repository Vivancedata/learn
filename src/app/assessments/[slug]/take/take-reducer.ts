import type { AssessmentQuestion as AssessmentQuestionType } from '@/types/assessment'

export interface AssessmentStartResponse {
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

export type AnswerValue = string | string[] | number
export type AssessmentData = AssessmentStartResponse['data']
export type AssessmentQuestionData = AssessmentData['questions'][number]

export interface AssessmentTakeState {
  assessmentData: AssessmentData | null
  currentQuestionIndex: number
  answers: Record<string, AnswerValue>
  flaggedQuestions: Set<number>
  loading: boolean
  error: string | null
  /** A failed submit keeps the attempt on screen so it can be resubmitted. */
  submitError: string | null
  isSubmitting: boolean
  showSubmitModal: boolean
  showSidebar: boolean
}

export type AssessmentTakeAction =
  | { type: 'startRequested' }
  | { type: 'startSucceeded'; assessmentData: AssessmentData }
  | { type: 'startFailed'; error: string }
  | { type: 'answerChanged'; questionId: string; answer: AnswerValue }
  | { type: 'flagToggled'; questionIndex: number }
  | { type: 'questionSelected'; questionIndex: number }
  | { type: 'previousQuestion' }
  | { type: 'nextQuestion'; totalQuestions: number }
  | { type: 'submitModalOpened' }
  | { type: 'submitModalClosed' }
  | { type: 'sidebarOpened' }
  | { type: 'sidebarClosed' }
  | { type: 'submissionStarted' }
  | { type: 'submissionFailed'; error: string }

export function createInitialAssessmentTakeState(): AssessmentTakeState {
  return {
    assessmentData: null,
    currentQuestionIndex: 0,
    answers: {},
    flaggedQuestions: new Set(),
    loading: true,
    error: null,
    submitError: null,
    isSubmitting: false,
    showSubmitModal: false,
    showSidebar: false,
  }
}

export function assessmentTakeReducer(
  state: AssessmentTakeState,
  action: AssessmentTakeAction
): AssessmentTakeState {
  switch (action.type) {
    case 'startRequested':
      return {
        ...state,
        loading: true,
        error: null,
      }
    case 'startSucceeded':
      return {
        ...state,
        assessmentData: action.assessmentData,
        loading: false,
      }
    case 'startFailed':
      return {
        ...state,
        loading: false,
        error: action.error,
      }
    case 'answerChanged':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.answer,
        },
      }
    case 'flagToggled': {
      const flaggedQuestions = new Set(state.flaggedQuestions)

      if (flaggedQuestions.has(action.questionIndex)) {
        flaggedQuestions.delete(action.questionIndex)
      } else {
        flaggedQuestions.add(action.questionIndex)
      }

      return {
        ...state,
        flaggedQuestions,
      }
    }
    case 'questionSelected':
      return {
        ...state,
        currentQuestionIndex: action.questionIndex,
        showSidebar: false,
      }
    case 'previousQuestion':
      if (state.currentQuestionIndex === 0) {
        return state
      }

      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex - 1,
      }
    case 'nextQuestion':
      if (state.currentQuestionIndex >= action.totalQuestions - 1) {
        return state
      }

      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      }
    case 'submitModalOpened':
      return {
        ...state,
        showSubmitModal: true,
      }
    case 'submitModalClosed':
      return {
        ...state,
        showSubmitModal: false,
      }
    case 'sidebarOpened':
      return {
        ...state,
        showSidebar: true,
      }
    case 'sidebarClosed':
      return {
        ...state,
        showSidebar: false,
      }
    case 'submissionStarted':
      return {
        ...state,
        isSubmitting: true,
        submitError: null,
        showSubmitModal: false,
      }
    case 'submissionFailed':
      // Not `error`: that replaces the whole test with the load-failure
      // screen, whose "Try Again" starts a brand-new attempt and timer.
      return {
        ...state,
        isSubmitting: false,
        submitError: action.error,
      }
    default:
      return state
  }
}
