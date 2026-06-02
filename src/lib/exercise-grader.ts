'use client'

/**
 * Bridges the exercise UI to the shared Pyodide runtime (`pyodide-runner`) and
 * the pytest grading harness (`python-harness`). Reuses the existing singleton
 * interpreter rather than spinning up a second one.
 */

import { loadPyodide } from '@/lib/pyodide-runner'
import {
  PYTHON_HARNESS,
  parseGradeOutput,
  parseRunOutput,
  type GradeResult,
  type RunOutput,
} from '@/lib/python-harness'

let harnessLoaded = false

async function ensureRuntime() {
  const py = await loadPyodide()
  if (!harnessLoaded) {
    py.runPython(PYTHON_HARNESS)
    harnessLoaded = true
  }
  return py
}

/** Execute the learner's code and capture stdout/stderr. */
export async function runExerciseCode(userCode: string): Promise<RunOutput> {
  const py = await ensureRuntime()
  py.globals.set('_vd_user_code', userCode)
  const json = py.runPython('_vd_run(_vd_user_code)') as string
  return parseRunOutput(json)
}

/** Auto-grade the learner's code against the exercise's pytest suite. */
export async function gradeExercise(
  moduleName: string,
  userCode: string,
  testCode: string
): Promise<GradeResult> {
  const py = await ensureRuntime()
  py.globals.set('_vd_module', moduleName)
  py.globals.set('_vd_user_code', userCode)
  py.globals.set('_vd_test_code', testCode)
  const json = py.runPython('_vd_grade(_vd_module, _vd_user_code, _vd_test_code)') as string
  return parseGradeOutput(json)
}
