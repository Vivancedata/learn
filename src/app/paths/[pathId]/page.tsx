"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { CourseList } from "@/components/course-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { Button } from "@/components/ui/button"
import { CourseCatalogEntry, Path } from "@/types/course"
import { useAuth } from "@/hooks/useAuth"

interface CourseProgressRow {
  courseId: string
  completedLessons: number
  totalLessons: number
  lastAccessed: string
}

export default function PathPage() {
  const params = useParams()
  const pathId = params.pathId as string
  const { user } = useAuth()
  const userId = user?.id

  const [path, setPath] = useState<Path | null>(null)
  const [courses, setCourses] = useState<CourseCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setFailed(false)

      try {
        // Load path, courses and (when signed in) progress in parallel. The
        // progress request only needs the user id, so it does not wait.
        const [pathRes, coursesRes, progressResponse] = await Promise.all([
          fetch(`/api/paths`),
          fetch('/api/courses'),
          userId
            ? fetch(`/api/progress/user/${userId}`, { credentials: 'include' }).catch(() => null)
            : Promise.resolve(null),
        ])
        const pathsData = pathRes.ok ? await pathRes.json() : { data: [] }
        const coursesData = coursesRes.ok ? await coursesRes.json() : { data: [] }
        const allPaths: Path[] = pathsData.data || []
        const allCourses: CourseCatalogEntry[] = coursesData.data || []
        const loadedPath = allPaths.find((p: Path) => p.id === pathId) || null

        if (loadedPath) {
          let resolvedCourses = allCourses

          if (progressResponse?.ok) {
            const progressData = (await progressResponse.json()).data ?? {}
            const progressByCourseId = new Map<string, CourseProgressRow>(
              (progressData.courses ?? []).map((progress: CourseProgressRow) => [
                progress.courseId,
                progress,
              ])
            )
            resolvedCourses = allCourses.map((course) => {
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
          }

          if (!cancelled) {
            setPath(loadedPath)
            setCourses(resolvedCourses)
          }
        }
      } catch (_error) {
        // A network failure is not the same as a missing path: say so and
        // offer a retry instead of "Path not found".
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [pathId, userId, reloadKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
        <span className="sr-only">Loading learning path…</span>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold">Could not load this path</h1>
        <p className="mt-4">
          The learning path did not load. Check your connection and try again.
        </p>
        <Button className="mt-4" onClick={() => setReloadKey((key) => key + 1)}>
          Try Again
        </Button>
      </div>
    )
  }

  if (!path) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold">Path not found</h1>
        <p className="mt-4">The learning path you are looking for does not exist.</p>
        <Link href="/paths" className="mt-4 inline-block underline">
          Back to paths
        </Link>
      </div>
    )
  }

  const pathCourseIds = new Set(path.courses)
  const pathCourses = courses.filter(course => pathCourseIds.has(course.id))
  const totalCourses = pathCourses.length
  const completedCourses = pathCourses.filter(
    course => 
      course.progress?.completed !== undefined && 
      course.progress?.total !== undefined &&
      course.progress.completed === course.progress.total
  ).length

  const progress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0
  const totalHours = pathCourses.reduce((acc, course) => acc + course.durationHours, 0)

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {path.icon && (
                <span className="text-2xl" aria-hidden="true">
                  {path.icon === 'globe' && '🌐'}
                  {path.icon === 'file' && '📄'}
                  {path.icon === 'window' && '🖥️'}
                </span>
              )}
              <CardTitle as="h1" className="text-3xl">{path.title}</CardTitle>
            </div>
            <CardDescription className="mt-2 max-w-2xl">
              {path.description}
            </CardDescription>
          </div>
          <ProgressCircle 
            progress={progress}
            size="lg"
            showPercentage
          />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{totalCourses}</span> courses
            </div>
            <div>
              <span className="font-medium">{totalHours || path.estimatedHours}</span> total hours
            </div>
            <div>
              <span className="font-medium">{completedCourses}</span> completed
            </div>
            {path.difficulty && (
              <div>
                <span className="font-medium">{path.difficulty}</span> difficulty
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Path Curriculum</h2>
        <CourseList courses={pathCourses} />
      </div>
    </div>
  )
}
