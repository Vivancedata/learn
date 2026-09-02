import { parseKnowledgeCheck, stripKnowledgeCheck } from '@/lib/content-utils'

// A lesson shaped like the real ones: prose, then the answer key, then more
// prose. The first bullet under each question is the correct answer.
const LESSON = `# Introduction to Neural Networks

Neural networks learn patterns from data.

## Activation Functions

ReLU is the most common choice for hidden layers.

## Knowledge Check

1. What is the purpose of an activation function?
   - To introduce non-linearity so the network can learn complex patterns
   - To speed up training
   - To reduce the number of parameters

2. What does ReLU output for negative inputs?
   - Zero
   - The input value itself
   - Negative infinity

## Further Reading

The Deep Learning Book, chapter 6.
`

describe('stripKnowledgeCheck', () => {
  const body = stripKnowledgeCheck(LESSON)

  it('removes the heading and the whole answer key from the rendered body', () => {
    expect(body).not.toContain('## Knowledge Check')
    expect(body).not.toContain('What is the purpose of an activation function?')
    expect(body).not.toContain('To introduce non-linearity')
    expect(body).not.toContain('What does ReLU output for negative inputs?')
  })

  it('keeps every other section, including the one after it', () => {
    expect(body).toContain('# Introduction to Neural Networks')
    expect(body).toContain('## Activation Functions')
    expect(body).toContain('ReLU is the most common choice for hidden layers.')
    expect(body).toContain('## Further Reading')
    expect(body).toContain('The Deep Learning Book, chapter 6.')
  })

  it('leaves content without a knowledge check untouched', () => {
    const plain = '# Title\n\nSome prose.\n'
    expect(stripKnowledgeCheck(plain)).toBe(plain)
  })

  it('handles a knowledge check that runs to the end of the file', () => {
    const trailing = '# Title\n\nProse.\n\n## Knowledge Check\n\n1. Q?\n   - A\n   - B\n'
    const stripped = stripKnowledgeCheck(trailing)
    expect(stripped).not.toContain('Knowledge Check')
    expect(stripped).not.toContain('- A')
    expect(stripped).toContain('Prose.')
  })
})

describe('parseKnowledgeCheck', () => {
  it('still parses the questions that were stripped from the body', () => {
    const parsed = parseKnowledgeCheck(LESSON)

    expect(parsed).not.toBeNull()
    expect(parsed!.questions).toHaveLength(2)
    expect(parsed!.questions[0]).toEqual({
      question: 'What is the purpose of an activation function?',
      options: [
        'To introduce non-linearity so the network can learn complex patterns',
        'To speed up training',
        'To reduce the number of parameters',
      ],
      correctAnswer: 0,
    })
    expect(parsed!.questions[1].question).toBe('What does ReLU output for negative inputs?')
  })

  it('does not invent questions when the lesson has no knowledge check', () => {
    // It used to return a hardcoded "What is HTML?" question for any lesson
    // whose content merely contained the heading.
    expect(parseKnowledgeCheck('# Title\n\nProse only.')).toBeNull()
    expect(parseKnowledgeCheck('')).toBeNull()
    expect(parseKnowledgeCheck('## Knowledge Check\n\nnothing numbered here')).toBeNull()
  })

  it('strip and parse agree: everything parsed is gone from the body', () => {
    const parsed = parseKnowledgeCheck(LESSON)!
    const body = stripKnowledgeCheck(LESSON)

    for (const question of parsed.questions) {
      expect(body).not.toContain(question.question)
      for (const option of question.options) {
        expect(body).not.toContain(option)
      }
    }
  })
})
