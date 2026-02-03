"use client"

import { PathCard } from "@/components/path-card"
import { Course, Path } from "@/types/course"
import { getAllPaths, getAllCourses } from "@/lib/content"
import { useEffect, useState } from "react"

export default function PathsPage() {
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
        
        setPaths(loadedPaths)
        setCourses(loadedCourses)
      } catch (_error) {
        // Error handled by empty state
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

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
