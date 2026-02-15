"use client"

import { useState, useEffect } from "react"
import { CourseList } from "@/components/course-list"
import { Course } from "@/types/course"
import { useAuth } from "@/hooks/useAuth"

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const coursesRes = await fetch('/api/courses')
        const coursesData = coursesRes.ok ? await coursesRes.json() : { data: [] }
        const loadedCourses: Course[] = coursesData.data || []

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
            return
          }
        }

        setCourses(loadedCourses)
      } catch (_error) {
        // Error handled by empty state
      } finally {
        setLoading(false)
      }
    }
    
    loadCourses()
  }, [user])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">All Courses</h1>
        <p className="text-muted-foreground">
          Browse our complete catalog of courses
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <CourseList courses={courses} />
        </div>
      )}
    </div>
  )
}
