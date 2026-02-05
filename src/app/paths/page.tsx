"use client"

import { PathCard } from "@/components/path-card"
import { Course, Path } from "@/types/course"
import { getAllPaths, getAllCourses } from "@/lib/content"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function PathsPage() {
  const { user } = useAuth()
  const [paths, setPaths] = useState<Path[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load paths and courses
        const [loadedPaths, loadedCourses] = await Promise.all([
          getAllPaths(),
          getAllCourses()
        ])

        if (user) {
          const progressResponse = await fetch(`/api/progress/user/${user.id}`, {
            credentials: 'include',
          })

          if (progressResponse.ok) {
            const progressData = await progressResponse.json()
            const coursesWithProgress = loadedCourses.map((course) => {
              const courseProgress = progressData.courses?.find(
                (progress: { courseId: string }) => progress.courseId === course.id
              )

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
      }
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Learning Paths</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose your learning journey from our curated paths
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paths.map((path) => (
          <PathCard 
            key={path.id} 
            path={path} 
            courses={courses}
          />
        ))}
      </div>
    </div>
  )
}
