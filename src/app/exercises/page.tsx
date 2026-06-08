import Link from 'next/link'
import { listExercises } from '@/lib/exercises'

export const dynamic = 'force-dynamic'

const TRACK_LABELS: Record<string, string> = {
  'python-basics': 'Python Basics',
  'sql-fundamentals': 'SQL Fundamentals',
}

export default async function ExercisesIndexPage() {
  const tracks = await listExercises()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Practice exercises</h1>
      <p className="mt-1 text-muted-foreground">
        Write code and get instant, auto-graded feedback in your browser.
      </p>

      {tracks.length === 0 && (
        <p className="mt-8 text-muted-foreground">No exercises available yet.</p>
      )}

      <div className="mt-8 space-y-8">
        {tracks.map((track) => (
          <section key={track.track}>
            <h2 className="mb-3 text-lg font-medium">
              {TRACK_LABELS[track.track] ?? track.track}
            </h2>
            <ul className="space-y-2">
              {track.exercises.map((ex) => (
                <li key={ex.slug}>
                  <Link
                    href={`/exercises/${ex.track}/${ex.slug}`}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="font-medium">{ex.title}</span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {ex.runnable ? ex.language : `${ex.language} · soon`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
