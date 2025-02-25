"use client"

import { useState, useEffect } from "react"
import { CourseList } from "@/components/course-list"
import { Course } from "@/types/course"
import { getAllCourses } from "@/lib/content"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const loadedCourses = await getAllCourses()
        setCourses(loadedCourses)
      } catch (error) {
        console.error("Error loading courses:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadCourses()
  }, [])

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
