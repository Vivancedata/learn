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

// One literal path per track, so bundlers and output file tracing can see
// exactly which directories are read (instead of `exercises/` + a variable).
const TRACK_DIRS: Record<string, string> = {
  'python-basics': path.join(process.cwd(), 'exercises/python-basics/exercises'),
  'sql-fundamentals': path.join(process.cwd(), 'exercises/sql-fundamentals/exercises'),
}

// Exercise files ship with the deployment and never change at runtime, so in
// production each one is read from disk once per server instance. Development
// keeps re-reading so edits show up without a restart. Only found exercises
// are cached: the key space of misses is attacker-controlled.
const cacheEnabled = process.env.NODE_ENV === 'production'
const exerciseCache = new Map<string, Promise<Exercise | null>>()
let exerciseIndexCache: Promise<TrackSummary[]> | null = null

/**
 * Load a single exercise's starter + test sources, or null if not found /
 * not a valid track+slug. Only Python exercises expose a `moduleName`; SQL is
 * recognized but not yet runnable in-browser.
 */
export async function getExercise(
  track: string,
  slug: string
): Promise<Exercise | null> {
  if (!cacheEnabled) {
    return loadExercise(track, slug)
  }

  const key = `${track}/${slug}`
  const cached = exerciseCache.get(key)
  if (cached) {
    return cached
  }

  const loading = loadExercise(track, slug)
  exerciseCache.set(key, loading)
  const exercise = await loading
  if (!exercise) {
    exerciseCache.delete(key)
  }
  return exercise
}

async function loadExercise(
  track: string,
  slug: string
): Promise<Exercise | null> {
  const language = TRACKS[track]
  if (!language || !SLUG_PATTERN.test(slug)) {
    return null
  }

  const dir = path.join(TRACK_DIRS[track], slug)

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

export interface ExerciseSummary {
  track: string
  slug: string
  title: string
  language: ExerciseLanguage
  /** Whether the exercise can be run + auto-graded in the browser today. */
  runnable: boolean
}

export interface TrackSummary {
  track: string
  language: ExerciseLanguage
  exercises: ExerciseSummary[]
}

/**
 * List every available exercise, grouped by track, for the index page.
 * Only directories that actually contain a `test_*.py` file are included.
 */
export function listExercises(): Promise<TrackSummary[]> {
  if (!cacheEnabled) {
    return loadExerciseIndex()
  }
  exerciseIndexCache ??= loadExerciseIndex()
  return exerciseIndexCache
}

async function loadExerciseIndex(): Promise<TrackSummary[]> {
  // Tracks, and the exercise folders within each, are read in parallel.
  const tracks = await Promise.all(
    Object.entries(TRACKS).map(async ([track, language]): Promise<TrackSummary | null> => {
      const trackDir = TRACK_DIRS[track]
      let slugs: string[]
      try {
        slugs = (await fs.readdir(trackDir, { withFileTypes: true }))
          .filter((d) => d.isDirectory() && SLUG_PATTERN.test(d.name))
          .map((d) => d.name)
          .sort()
      } catch {
        return null
      }

      const entriesBySlug = await Promise.all(
        slugs.map((slug) => fs.readdir(path.join(trackDir, slug)).catch(() => [] as string[]))
      )

      const exercises: ExerciseSummary[] = []
      slugs.forEach((slug, i) => {
        const hasTest = entriesBySlug[i].some((f) => f.startsWith('test_') && f.endsWith('.py'))
        if (!hasTest) return
        exercises.push({
          track,
          slug,
          title: titleFromSlug(slug),
          language,
          runnable: language === 'python', // SQL grading isn't wired up yet
        })
      })

      return exercises.length > 0 ? { track, language, exercises } : null
    })
  )

  return tracks.filter((t): t is TrackSummary => t !== null)
}

