import { parseGradeOutput, parseRunOutput } from '@/lib/python-harness'

describe('parseGradeOutput', () => {
  it('summarizes an all-passing run', () => {
    const json = JSON.stringify({
      results: [
        { name: 'TestA.test_x', status: 'passed', message: null },
        { name: 'TestA.test_y', status: 'passed', message: null },
      ],
      compileError: null,
    })
    const result = parseGradeOutput(json)
    expect(result.total).toBe(2)
    expect(result.passed).toBe(2)
    expect(result.allPassed).toBe(true)
    expect(result.compileError).toBeNull()
  })

  it('summarizes a partial run as not-all-passed', () => {
    const json = JSON.stringify({
      results: [
        { name: 'test_a', status: 'passed', message: null },
        { name: 'test_b', status: 'failed', message: 'assertion failed' },
        { name: 'test_c', status: 'error', message: 'NameError: math' },
      ],
      compileError: null,
    })
    const result = parseGradeOutput(json)
    expect(result.total).toBe(3)
    expect(result.passed).toBe(1)
    expect(result.allPassed).toBe(false)
  })

  it('surfaces a compile error and is never all-passed', () => {
    const json = JSON.stringify({ results: [], compileError: 'SyntaxError: bad' })
    const result = parseGradeOutput(json)
    expect(result.compileError).toContain('SyntaxError')
    expect(result.allPassed).toBe(false)
    expect(result.total).toBe(0)
  })

  it('handles malformed JSON without throwing', () => {
    const result = parseGradeOutput('not json')
    expect(result.allPassed).toBe(false)
    expect(result.compileError).toMatch(/parse/i)
  })
})

describe('parseRunOutput', () => {
  it('returns stdout and no error on success', () => {
    const out = parseRunOutput(JSON.stringify({ stdout: 'hello\n', error: null }))
    expect(out.stdout).toBe('hello\n')
    expect(out.error).toBeNull()
  })

  it('returns the error when execution failed', () => {
    const out = parseRunOutput(JSON.stringify({ stdout: '', error: 'Traceback...' }))
    expect(out.error).toContain('Traceback')
  })

  it('handles malformed JSON', () => {
    const out = parseRunOutput('{')
    expect(out.error).toMatch(/parse/i)
  })
})
