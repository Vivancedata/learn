import { NextRequest } from 'next/server'
import { GET as getExerciseRoute } from '../exercises/[track]/[slug]/route'
import { GET as listExercisesRoute } from '../exercises/route'

// This is a genuine integration test: it reads the real exercise files from
// the repo's exercises/ directory (no mocking), exercising getExercise too.

function params(track: string, slug: string) {
  return { params: Promise.resolve({ track, slug }) }
}

describe('GET /api/exercises/[track]/[slug]', () => {
  it('returns a real python exercise with starter + test code', async () => {
    const request = new NextRequest('http://localhost/api/exercises/python-basics/01-variables')
    const response = await getExerciseRoute(request, params('python-basics', '01-variables'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.language).toBe('python')
    expect(data.data.moduleName).toBe('variables')
    expect(data.data.starterCode).toContain('calculate_circle_area')
    expect(data.data.testCode).toContain('TestCalculateCircleArea')
    expect(data.data.title).toBe('Variables')
  })

  it('returns 404 for an unknown track', async () => {
    const request = new NextRequest('http://localhost/api/exercises/not-a-track/01-variables')
    const response = await getExerciseRoute(request, params('not-a-track', '01-variables'))
    expect(response.status).toBe(404)
  })

  it('returns 404 for an unknown slug', async () => {
    const request = new NextRequest('http://localhost/api/exercises/python-basics/99-nope')
    const response = await getExerciseRoute(request, params('python-basics', '99-nope'))
    expect(response.status).toBe(404)
  })

  it('rejects path-traversal slugs', async () => {
    const request = new NextRequest('http://localhost/api/exercises/python-basics/..%2f..')
    const response = await getExerciseRoute(request, params('python-basics', '../..'))
    expect(response.status).toBe(404)
  })
})

describe('GET /api/exercises (index)', () => {
  it('lists exercises grouped by track', async () => {
    const request = new NextRequest('http://localhost/api/exercises')
    const response = await listExercisesRoute(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    const python = data.data.find((t: { track: string }) => t.track === 'python-basics')
    expect(python).toBeDefined()
    expect(python.language).toBe('python')
    const slugs = python.exercises.map((e: { slug: string }) => e.slug)
    expect(slugs).toContain('01-variables')
    // Every listed exercise carries a title and runnable flag
    expect(python.exercises[0].title).toBeTruthy()
    expect(typeof python.exercises[0].runnable).toBe('boolean')

    // SQL exercises are listed but flagged not-yet-runnable
    const sql = data.data.find((t: { track: string }) => t.track === 'sql-fundamentals')
    expect(sql.exercises.every((e: { runnable: boolean }) => e.runnable === false)).toBe(true)
  })
})
