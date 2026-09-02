"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * How long a load may run before the page owes the reader an explanation.
 * Nielsen's threshold for "keep the user informed" is 10s; this app was
 * spending 5s in the middle of a bare spinner, so the notice lands earlier.
 */
export const SLOW_LOAD_MS = 3000

/** True once `delayMs` has elapsed since mount. */
export function useElapsed(delayMs: number = SLOW_LOAD_MS): boolean {
  const [elapsed, setElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  return elapsed
}

/**
 * A line of copy that appears only when a load has been running long enough
 * that silence would read as breakage. Named, not generic: it says what is
 * being fetched.
 */
export function SlowLoadNotice({ children }: { children: React.ReactNode }) {
  const slow = useElapsed()

  if (!slow) return null

  return (
    <p className="text-sm text-muted-foreground" role="status">
      {children}
    </p>
  )
}

/** Skeleton matching the /paths grid: a heading block plus path cards. */
export function PathsSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="flex flex-col items-center gap-4 text-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96 max-w-full" />
        <SlowLoadNotice>
          Still loading your learning paths. The catalogue is coming from the
          database, which can take a moment on the first request.
        </SlowLoadNotice>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-xl border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton matching the lesson layout: title row, prose card, sidebar. */
export function LessonSkeleton() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <div className="container py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Skeleton className="h-9 w-2/3 max-w-md" />
              <Skeleton className="h-10 w-40" />
            </div>

            <div className="rounded-xl border border-border p-6 space-y-4">
              <Skeleton className="h-7 w-1/2" />
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} className={index % 3 === 2 ? 'h-4 w-4/5' : 'h-4 w-full'} />
              ))}
              <Skeleton className="h-40 w-full rounded-lg" />
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className={index === 2 ? 'h-4 w-3/4' : 'h-4 w-full'} />
              ))}
            </div>

            <SlowLoadNotice>
              Still loading this lesson. The text and its code samples are being
              fetched now; nothing you have completed is affected.
            </SlowLoadNotice>
          </div>

          <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20 space-y-3">
              <Skeleton className="h-5 w-40" />
              {[0, 1, 2, 3, 4].map((index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
