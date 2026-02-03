"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { CourseList } from "@/components/course-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { Course, Path } from "@/types/course"
import { getPathById, getAllCourses } from "@/lib/content"

export default function PathPage() {
  const params = useParams()
  const pathId = params.pathId as string
  
  const [path, setPath] = useState<Path | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load path and courses
        const [loadedPath, allCourses] = await Promise.all([
          getPathById(pathId),
          getAllCourses()
        ])
        
        if (loadedPath) {
          setPath(loadedPath)
          setCourses(allCourses)
        }
      } catch (_error) {
        // Error handled by null path state
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [pathId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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

  const pathCourses = courses.filter(course => path.courses.includes(course.id))
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
                <span className="text-2xl">
                  {path.icon === 'globe' && '🌐'}
                  {path.icon === 'file' && '📄'}
                  {path.icon === 'window' && '🖥️'}
                </span>
              )}
              <CardTitle className="text-3xl">{path.title}</CardTitle>
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
