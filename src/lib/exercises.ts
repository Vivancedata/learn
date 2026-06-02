/**
 * Coding-exercise loader.
 *
 * Reads the hands-on exercises that live in the repo's top-level `exercises/`
 * directory (e.g. `exercises/python-basics/exercises/01-variables/`). Each
 * exercise folder contains a starter file, a `*_solution` file, and a
 * `test_*.py` file. We surface the starter + tests so they can be run and
 * auto-graded in the browser (see `PythonExercise` + the Pyodide harness).
 */

import { promises as fs } from 'fs'
import path from 'path'

export type ExerciseLanguage = 'python' | 'sql'

export interface Exercise {
  track: string
  slug: string
  title: string
  language: ExerciseLanguage
  /** Python module name the test file imports from (e.g. "variables"). */
  moduleName: string
  /** Starter code shown in the editor. */
  starterCode: string
  /** The test source used to auto-grade the learner's code. */
  testCode: string
  /** Optional human-readable instructions (from the exercise README). */
  instructions: string | null
}

// Only allow known tracks, and a strict slug shape, to prevent path traversal.
const TRACKS: Record<string, ExerciseLanguage> = {
  'python-basics': 'python',
  'sql-fundamentals': 'sql',
}
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/

function titleFromSlug(slug: string): string {
  return slug
    .replace(/^\d+-/, '') // drop leading "01-"
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function exercisesRoot(): string {
  return path.join(process.cwd(), 'exercises')
}

/**
 * Load a single exercise's starter + test sources, or null if not found /
 * not a valid track+slug. Only Python exercises expose a `moduleName`; SQL is
 * recognized but not yet runnable in-browser.
 */
export async function getExercise(
  track: string,
  slug: string
): Promise<Exercise | null> {
  const language = TRACKS[track]
  if (!language || !SLUG_PATTERN.test(slug)) {
    return null
  }

  const dir = path.join(exercisesRoot(), track, 'exercises', slug)

  let entries: string[]
  try {
    entries = await fs.readdir(dir)
  } catch {
    return null
  }

  const ext = language === 'python' ? '.py' : '.sql'
  const testFile = entries.find((f) => f.startsWith('test_') && f.endsWith('.py'))
  const starterFile = entries.find(
    (f) =>
      f.endsWith(ext) &&
      !f.startsWith('test_') &&
      !f.includes('_solution') &&
      !f.includes('solution.')
  )

  if (!testFile || !starterFile) {
    return null
  }

  const [starterCode, testCode, instructions] = await Promise.all([
    fs.readFile(path.join(dir, starterFile), 'utf8'),
    fs.readFile(path.join(dir, testFile), 'utf8'),
    fs
      .readFile(path.join(dir, 'README.md'), 'utf8')
      .catch(() => null),
  ])

  return {
    track,
    slug,
    title: titleFromSlug(slug),
    language,
    moduleName: path.basename(starterFile, ext),
    starterCode,
    testCode,
    instructions,
  }
}
