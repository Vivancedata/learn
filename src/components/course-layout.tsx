"use client"

import { useState, useEffect } from "react"
import { CourseSidebar } from "@/components/course-sidebar"
import { Course, Lesson } from "@/types/course"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface CourseLayoutProps {
  course: Course
  currentLessonId?: string
  children: React.ReactNode
}

export function CourseLayout({ course, currentLessonId, children }: CourseLayoutProps) {
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null)
  const [prevLesson, setPrevLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!currentLessonId) return

    let foundNext = false
    let foundPrev = false

    // Find the current lesson's position and determine next/prev
    course.sections.forEach((section) => {
      const currentIndex = section.lessons.findIndex(l => l.id === currentLessonId)
      if (currentIndex !== -1) {
        // Previous lesson in same section
        if (currentIndex > 0) {
          setPrevLesson(section.lessons[currentIndex - 1])
          foundPrev = true
        }
        // Next lesson in same section
        if (currentIndex < section.lessons.length - 1) {
          setNextLesson(section.lessons[currentIndex + 1])
          foundNext = true
        }
      }
    })

    // If next/prev weren't found in the same section, look in adjacent sections
    if (!foundNext || !foundPrev) {
      const sectionIndex = course.sections.findIndex(
        s => s.lessons.some(l => l.id === currentLessonId)
      )

      if (sectionIndex !== -1) {
        // Look in previous section for prev lesson
        if (!foundPrev && sectionIndex > 0) {
          const prevSection = course.sections[sectionIndex - 1]
          setPrevLesson(prevSection.lessons[prevSection.lessons.length - 1])
        }

        // Look in next section for next lesson
        if (!foundNext && sectionIndex < course.sections.length - 1) {
          const nextSection = course.sections[sectionIndex + 1]
          setNextLesson(nextSection.lessons[0])
        }
      }
    }
  }, [course, currentLessonId])

  return (
    <div className="flex min-h-screen">
      <CourseSidebar course={course} />

      <div className="flex-1">
        <div className="container py-8">
          {children}

          {currentLessonId && (
            <div className="mt-12 flex items-center justify-between border-t pt-6">
              <div>
                {prevLesson && (
                  <Button variant="outline" asChild>
                    <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous Lesson
                    </Link>
                  </Button>
                )}
              </div>
              <div>
                {nextLesson && (
                  <Button asChild>
                    <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                      Next Lesson
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
