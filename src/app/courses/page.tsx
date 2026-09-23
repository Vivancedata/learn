"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { CourseList, CourseListSkeleton } from "@/components/course-list"
import { Button } from "@/components/ui/button"
import { CourseCatalogEntry } from "@/types/course"
import { useAuth } from "@/hooks/useAuth"

interface CourseProgressRow {
  courseId: string
  completedLessons: number
  totalLessons: number
  lastAccessed: string
}

export default function CoursesPage() {
  const { user } = useAuth()
  const userId = user?.id
  const [courses, setCourses] = useState<CourseCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const retry = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      setLoading(true)
      setFailed(false)

      try {
        // Both requests are independent, so start them together. A failed
        // progress request only drops the progress overlay, never the catalog.
        const coursesPromise = fetch('/api/courses')
        const progressPromise = userId
          ? fetch(`/api/progress/user/${userId}`, { credentials: 'include' }).catch(() => null)
          : Promise.resolve(null)

        const coursesRes = await coursesPromise
        if (!coursesRes.ok) throw new Error('Failed to load courses')
        const coursesData = await coursesRes.json()
        const loadedCourses: CourseCatalogEntry[] = coursesData.data || []

        const progressResponse = await progressPromise
        if (progressResponse?.ok) {
          const progressData = (await progressResponse.json()).data ?? {}
          const progressByCourseId = new Map<string, CourseProgressRow>(
            (progressData.courses ?? []).map((progress: CourseProgressRow) => [
              progress.courseId,
              progress,
            ])
          )
          const coursesWithProgress = loadedCourses.map((course) => {
            const courseProgress = progressByCourseId.get(course.id)

            if (courseProgress) {
              return {
                ...course,
                progress: {
                  completed: courseProgress.completedLessons,
                  total: courseProgress.totalLessons,
                  lastAccessed: courseProgress.lastAccessed,
                },
              }
            }

            return course
          })

          if (!cancelled) setCourses(coursesWithProgress)
          return
        }

        if (!cancelled) setCourses(loadedCourses)
      } catch {
        if (!cancelled) {
          setCourses([])
          setFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCourses()

    return () => {
      cancelled = true
    }
  }, [userId, reloadKey])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">All Courses</h1>
        <p className="text-muted-foreground">
          Browse our complete catalog of courses
        </p>
      </div>

      {loading ? (
        <CourseListSkeleton />
      ) : failed ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <h2 className="text-heading-3 font-semibold">We could not load the catalog</h2>
          <p className="mx-auto mt-2 max-w-md text-body-sm text-muted-foreground">
            The course list did not come back this time. Your progress is safe — this
            is only the catalog view.
          </p>
          <Button className="mt-6" onClick={retry}>
            Try Again
          </Button>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-heading-3 font-semibold">No courses published yet</h2>
          <p className="mx-auto mt-2 max-w-md text-body-sm text-muted-foreground">
            New courses are added as they are written. In the meantime, a skill
            assessment is a good way to find out where to start.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/assessments">Take an assessment</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <CourseList courses={courses} />
        </div>
      )}
    </div>
  )
}
