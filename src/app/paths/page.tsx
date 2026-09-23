"use client"

import { PathCard } from "@/components/path-card"
import { Course, Path } from "@/types/course"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { PathsSkeleton } from "@/components/loading-states"

interface ProgressEntry {
  courseId: string
  completedLessons: number
  totalLessons: number
  lastAccessed: string
}

export default function PathsPage() {
  const { user } = useAuth()
  const userId = user?.id
  const [paths, setPaths] = useState<Path[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load paths, courses and (when signed in) progress in parallel via
        // API routes (not direct Prisma imports)
        const [pathsRes, coursesRes, progressResponse] = await Promise.all([
          fetch('/api/paths'),
          fetch('/api/courses'),
          userId
            ? fetch(`/api/progress/user/${userId}`, { credentials: 'include' })
            : Promise.resolve(null),
        ])

        const pathsData = pathsRes.ok ? await pathsRes.json() : { data: [] }
        const coursesData = coursesRes.ok ? await coursesRes.json() : { data: [] }
        const loadedPaths: Path[] = pathsData.data || []
        const loadedCourses: Course[] = coursesData.data || []

        if (progressResponse) {
          if (progressResponse.ok) {
            const progressData = (await progressResponse.json()).data ?? {}
            const progressByCourseId = new Map<string, ProgressEntry>(
              ((progressData.courses ?? []) as ProgressEntry[]).map((progress) => [
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

            setCourses(coursesWithProgress)
          } else {
            setCourses(loadedCourses)
          }
        } else {
          setCourses(loadedCourses)
        }

        setPaths(loadedPaths)
      } catch (error) {
        console.error("Error loading paths data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  // A path with no courses has nothing to view; listing it as a
  // "0 courses" card only advertises missing content.
  const visiblePaths = useMemo(() => {
    const pathIdsWithCourses = new Set(courses.map((course) => course.pathId))
    return paths.filter((path) => pathIdsWithCourses.has(path.id))
  }, [paths, courses])

  if (loading) {
    return <PathsSkeleton />
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Learning Paths</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose your learning journey from our curated paths
        </p>
      </div>
      {visiblePaths.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No learning paths are available right now. Refresh the page to try again.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePaths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              courses={courses}
            />
          ))}
        </div>
      )}
    </div>
  )
}
