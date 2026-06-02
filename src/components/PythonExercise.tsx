'use client'

import { useState } from 'react'
import { runExerciseCode, gradeExercise } from '@/lib/exercise-grader'
import {
  type GradeResult,
  type RunOutput,
} from '@/lib/python-harness'
import { Button } from '@/components/ui/button'

interface PythonExerciseProps {
  title: string
  moduleName: string
  starterCode: string
  testCode: string
}

/**
 * An interactive, auto-graded Python exercise. The learner edits code, runs it
 * (stdout in-browser), and checks it against the exercise's real pytest suite —
 * all client-side via Pyodide, no backend round-trip.
 */
export function PythonExercise({
  title,
  moduleName,
  starterCode,
  testCode,
}: PythonExerciseProps) {
  const [code, setCode] = useState(starterCode)
  const [busy, setBusy] = useState<null | 'run' | 'check'>(null)
  const [loadingRuntime, setLoadingRuntime] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runOutput, setRunOutput] = useState<RunOutput | null>(null)
  const [grade, setGrade] = useState<GradeResult | null>(null)

  const disabled = busy !== null

  // The runtime loads lazily on first Run/Check; surface that to the learner.
  function withRuntimeHint<T>(p: Promise<T>): Promise<T> {
    setLoadingRuntime(true)
    return p.finally(() => setLoadingRuntime(false))
  }

  async function handleRun() {
    setBusy('run')
    setError(null)
    setGrade(null)
    try {
      setRunOutput(await withRuntimeHint(runExerciseCode(code)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run code')
    } finally {
      setBusy(null)
    }
  }

  async function handleCheck() {
    setBusy('check')
    setError(null)
    setRunOutput(null)
    try {
      setGrade(await withRuntimeHint(gradeExercise(moduleName, code, testCode)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check solution')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRun} disabled={disabled}>
            {busy === 'run' ? 'Running…' : 'Run'}
          </Button>
          <Button onClick={handleCheck} disabled={disabled}>
            {busy === 'check' ? 'Checking…' : 'Check solution'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCode(starterCode)
              setRunOutput(null)
              setGrade(null)
              setError(null)
            }}
            disabled={disabled}
          >
            Reset
          </Button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        aria-label={`${title} code editor`}
        className="h-80 w-full resize-y rounded-md border border-border bg-muted/30 p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {loadingRuntime && (
        <p className="text-sm text-muted-foreground">
          Loading the Python runtime (first run only)…
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {runOutput && (
        <div>
          <h3 className="mb-1 text-sm font-medium">Output</h3>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
            {runOutput.error
              ? runOutput.stdout + runOutput.error
              : runOutput.stdout || '(no output)'}
          </pre>
        </div>
      )}

      {grade && <GradeReport grade={grade} />}
    </div>
  )
}

function GradeReport({ grade }: { grade: GradeResult }) {
  if (grade.compileError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3" role="alert">
        <p className="mb-1 text-sm font-medium text-destructive">Your code couldn’t run</p>
        <pre className="overflow-x-auto text-xs">{grade.compileError}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p
        className={`text-sm font-medium ${grade.allPassed ? 'text-green-600' : 'text-amber-600'}`}
        role="status"
      >
        {grade.allPassed
          ? `All ${grade.total} tests passed 🎉`
          : `${grade.passed} / ${grade.total} tests passing`}
      </p>
      <ul className="space-y-1">
        {grade.results.map((r) => (
          <li key={r.name} className="flex items-start gap-2 text-sm">
            <span aria-hidden>{r.status === 'passed' ? '✅' : '❌'}</span>
            <span className="font-mono">{r.name}</span>
            {r.message && (
              <span className="text-muted-foreground">— {r.message}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
