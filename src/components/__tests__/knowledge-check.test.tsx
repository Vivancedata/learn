import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { KnowledgeCheck } from '@/components/knowledge-check'

const QUESTIONS = [
  {
    question: 'What is the purpose of an activation function?',
    options: [
      'To introduce non-linearity',
      'To speed up training',
      'To reduce the number of parameters',
    ],
    correctAnswer: 0,
    explanation: 'Without it the network collapses to a linear map.',
  },
  {
    question: 'What does ReLU output for negative inputs?',
    options: ['Zero', 'The input value itself'],
    correctAnswer: 0,
  },
]

describe('KnowledgeCheck', () => {
  it('renders the options as a radio group, not clickable divs', () => {
    render(<KnowledgeCheck questions={QUESTIONS} />)

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)

    // Same name => one group => arrow keys move between them natively.
    const names = new Set(radios.map((r) => (r as HTMLInputElement).name))
    expect(names.size).toBe(1)

    // The question is the group's accessible name.
    expect(
      screen.getByRole('group', { name: /purpose of an activation function/i })
    ).toBeInTheDocument()
  })

  it('is operable from the keyboard', () => {
    render(<KnowledgeCheck questions={QUESTIONS} />)

    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    // Radios are focusable; divs with onClick were not.
    radios[1].focus()
    expect(document.activeElement).toBe(radios[1])

    fireEvent.click(radios[1])
    expect(radios[1].checked).toBe(true)

    expect(screen.getByRole('button', { name: /check answer/i })).toBeEnabled()
  })

  it('disables Check Answer until something is selected', () => {
    render(<KnowledgeCheck questions={QUESTIONS} />)
    expect(screen.getByRole('button', { name: /check answer/i })).toBeDisabled()
  })

  it('announces the result in a live region and does not lock selection silently', () => {
    const { container } = render(<KnowledgeCheck questions={QUESTIONS} />)

    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    fireEvent.click(radios[1])
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))

    const live = container.querySelector('[aria-live="polite"]')
    expect(live).not.toBeNull()
    expect(live!.textContent).toContain('Not quite')
    expect(live!.textContent).toContain('Without it the network collapses to a linear map.')

    // The lock is a real disabled state, visible and announced -- previously
    // clicks were simply ignored while the options still looked interactive.
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
    expect(live!.textContent).toContain('This answer is locked')
  })

  it('names the correct answer when the question carries no explanation', () => {
    render(<KnowledgeCheck questions={QUESTIONS} />)

    // Skip to question 2, which has no explanation.
    fireEvent.click(screen.getAllByRole('radio')[0])
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))
    fireEvent.click(screen.getAllByRole('radio')[1])
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))

    expect(screen.getByText('The answer is: Zero')).toBeInTheDocument()
  })

  it('moves to the next question and scores the quiz', () => {
    const onComplete = jest.fn()
    render(<KnowledgeCheck questions={QUESTIONS} onComplete={onComplete} />)

    fireEvent.click(screen.getAllByRole('radio')[0])
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /next question/i }))

    expect(
      screen.getByRole('group', { name: /ReLU output for negative inputs/i })
    ).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('radio')[1])
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /see results/i }))

    expect(onComplete).toHaveBeenCalledWith({ score: 50, selectedAnswers: [0, 1] })
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
