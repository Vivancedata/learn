import {
  assessmentTakeReducer,
  createInitialAssessmentTakeState,
} from '../[slug]/take/take-reducer'
import { at } from '@/test-utils/at'


type State = ReturnType<typeof createInitialAssessmentTakeState>

function inProgressAttempt(): State {
  const started = assessmentTakeReducer(createInitialAssessmentTakeState(), {
    type: 'startSucceeded',
    assessmentData: { attemptId: 'attempt-1', name: 'SQL', questions: [] } as never,
  })
  return assessmentTakeReducer(started, {
    type: 'answerChanged',
    questionId: 'q1',
    answer: 2,
  })
}

describe('assessment take reducer', () => {
  it('keeps the attempt and its answers when submission fails', () => {
    const submitting = assessmentTakeReducer(inProgressAttempt(), { type: 'submissionStarted' })

    const failed = assessmentTakeReducer(submitting, {
      type: 'submissionFailed',
      error: 'Failed to submit assessment. Please try again.',
    })

    // A load error swaps the test for the "start again" screen
    expect(failed.error).toBeNull()
    expect(failed.submitError).toBe('Failed to submit assessment. Please try again.')
    expect(failed.assessmentData?.attemptId).toBe('attempt-1')
    expect(failed.answers).toEqual({ q1: 2 })
    expect(failed.isSubmitting).toBe(false)
  })

  it('clears the submit error when the user retries', () => {
    const failed = assessmentTakeReducer(inProgressAttempt(), {
      type: 'submissionFailed',
      error: 'Failed',
    })

    const retrying = assessmentTakeReducer(failed, { type: 'submissionStarted' })

    expect(retrying.submitError).toBeNull()
    expect(retrying.isSubmitting).toBe(true)
  })
})

describe('assessment take reducer: loading', () => {
  it('starts loading with no attempt, answers, flags or open overlays', () => {
    const initial = createInitialAssessmentTakeState()

    expect(initial).toMatchObject({
      assessmentData: null,
      currentQuestionIndex: 0,
      answers: {},
      loading: true,
      error: null,
      submitError: null,
      isSubmitting: false,
      showSubmitModal: false,
      showSidebar: false,
    })
    expect(initial.flaggedQuestions.size).toBe(0)
  })

  it('records a start failure and clears it when a new start is requested', () => {
    const failed = assessmentTakeReducer(createInitialAssessmentTakeState(), {
      type: 'startFailed',
      error: 'Assessment not found',
    })
    expect(failed.loading).toBe(false)
    expect(failed.error).toBe('Assessment not found')
    expect(failed.assessmentData).toBeNull()

    const retrying = assessmentTakeReducer(failed, { type: 'startRequested' })
    expect(retrying.loading).toBe(true)
    expect(retrying.error).toBeNull()
  })

  it('stops loading once the attempt has started', () => {
    const started = inProgressAttempt()
    expect(started.loading).toBe(false)
    expect(started.assessmentData?.name).toBe('SQL')
  })
})

describe('assessment take reducer: answers and flags', () => {
  it('overwrites an answer for the same question and keeps the others', () => {
    let state = inProgressAttempt()
    state = assessmentTakeReducer(state, { type: 'answerChanged', questionId: 'q2', answer: ['a', 'c'] })
    state = assessmentTakeReducer(state, { type: 'answerChanged', questionId: 'q1', answer: 'SELECT 1' })

    expect(state.answers).toEqual({ q1: 'SELECT 1', q2: ['a', 'c'] })
  })

  it('does not mutate the previous answers object', () => {
    const before = inProgressAttempt()
    const snapshot = { ...before.answers }

    assessmentTakeReducer(before, { type: 'answerChanged', questionId: 'q9', answer: 0 })

    expect(before.answers).toEqual(snapshot)
  })

  it('toggles a flag on and back off without touching other flags', () => {
    let state = inProgressAttempt()
    state = assessmentTakeReducer(state, { type: 'flagToggled', questionIndex: 1 })
    state = assessmentTakeReducer(state, { type: 'flagToggled', questionIndex: 3 })
    expect([...state.flaggedQuestions].sort()).toEqual([1, 3])

    state = assessmentTakeReducer(state, { type: 'flagToggled', questionIndex: 1 })
    expect([...state.flaggedQuestions]).toEqual([3])
  })

  it('builds a new flag set instead of mutating the previous one', () => {
    const before = inProgressAttempt()
    const after = assessmentTakeReducer(before, { type: 'flagToggled', questionIndex: 0 })

    expect(after.flaggedQuestions).not.toBe(before.flaggedQuestions)
    expect(before.flaggedQuestions.size).toBe(0)
    expect(after.flaggedQuestions.has(0)).toBe(true)
  })
})

describe('assessment take reducer: navigation', () => {
  it('returns the same state when moving back from the first question', () => {
    const state = inProgressAttempt()
    expect(assessmentTakeReducer(state, { type: 'previousQuestion' })).toBe(state)
  })

  it('returns the same state when moving forward from the last question', () => {
    const atLast = assessmentTakeReducer(inProgressAttempt(), { type: 'questionSelected', questionIndex: 4 })
    expect(assessmentTakeReducer(atLast, { type: 'nextQuestion', totalQuestions: 5 })).toBe(atLast)
  })

  it('does not advance when the assessment has no questions', () => {
    const state = inProgressAttempt()
    expect(assessmentTakeReducer(state, { type: 'nextQuestion', totalQuestions: 0 })).toBe(state)
  })

  it('closes the sidebar when a question is picked from it', () => {
    let state = assessmentTakeReducer(inProgressAttempt(), { type: 'sidebarOpened' })
    expect(state.showSidebar).toBe(true)

    state = assessmentTakeReducer(state, { type: 'questionSelected', questionIndex: 2 })
    expect(state.currentQuestionIndex).toBe(2)
    expect(state.showSidebar).toBe(false)
  })

  it('keeps the index within [0, total - 1] for every prev/next sequence', () => {
    const totalQuestions = 4
    const steps = 7
    const moves = ['previousQuestion', 'nextQuestion'] as const

    for (let mask = 0; mask < 2 ** steps; mask++) {
      let state = inProgressAttempt()
      let expected = 0
      for (let step = 0; step < steps; step++) {
        const move = at(moves, (mask >> step) & 1)
        state =
          move === 'nextQuestion'
            ? assessmentTakeReducer(state, { type: move, totalQuestions })
            : assessmentTakeReducer(state, { type: move })
        expected =
          move === 'nextQuestion'
            ? Math.min(expected + 1, totalQuestions - 1)
            : Math.max(expected - 1, 0)
        expect(state.currentQuestionIndex).toBe(expected)
      }
    }
  })
})

describe('assessment take reducer: overlays and submission', () => {
  it('opens and closes the submit modal and the sidebar', () => {
    let state = inProgressAttempt()
    state = assessmentTakeReducer(state, { type: 'submitModalOpened' })
    expect(state.showSubmitModal).toBe(true)
    state = assessmentTakeReducer(state, { type: 'submitModalClosed' })
    expect(state.showSubmitModal).toBe(false)

    state = assessmentTakeReducer(state, { type: 'sidebarOpened' })
    expect(state.showSidebar).toBe(true)
    state = assessmentTakeReducer(state, { type: 'sidebarClosed' })
    expect(state.showSidebar).toBe(false)
  })

  it('closes the confirm modal when submission starts', () => {
    const confirming = assessmentTakeReducer(inProgressAttempt(), { type: 'submitModalOpened' })
    const submitting = assessmentTakeReducer(confirming, { type: 'submissionStarted' })

    expect(submitting.showSubmitModal).toBe(false)
    expect(submitting.isSubmitting).toBe(true)
  })

  it('returns the same state for an unknown action', () => {
    const state = inProgressAttempt()
    expect(assessmentTakeReducer(state, { type: 'unknown' } as never)).toBe(state)
  })
})
