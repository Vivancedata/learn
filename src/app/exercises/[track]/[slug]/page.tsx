import { notFound } from 'next/navigation'
import { getExercise } from '@/lib/exercises'
import { PythonExercise } from '@/components/PythonExercise'

export const dynamic = 'force-dynamic'

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ track: string; slug: string }>
}) {
  const { track, slug } = await params
  const exercise = await getExercise(track, slug)

  if (!exercise) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-1 text-sm text-muted-foreground">{exercise.track}</p>

      {exercise.instructions && (
        <details className="mb-6 rounded-md border border-border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Instructions
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {exercise.instructions}
          </pre>
        </details>
      )}

      {exercise.language === 'python' ? (
        <PythonExercise
          title={exercise.title}
          moduleName={exercise.moduleName}
          starterCode={exercise.starterCode}
          testCode={exercise.testCode}
        />
      ) : (
        <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
          In-browser running for {exercise.language.toUpperCase()} exercises is
          coming soon. For now, work through it locally with the provided tests.
        </div>
      )}
    </main>
  )
}
