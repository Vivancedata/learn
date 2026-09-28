import {
  assessmentTakeReducer,
  createInitialAssessmentTakeState,
} from '../[slug]/take/take-reducer'


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
