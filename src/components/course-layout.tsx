"use client"

import { useMemo } from "react"
import { CourseSidebar } from "@/components/course-sidebar"
import { Course, Lesson } from "@/types/course"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface CourseLayoutProps {
  course: Course
  currentLessonId?: string
  completedLessonIds?: string[]
  children: React.ReactNode
}

/**
 * The lessons either side of `currentLessonId`, crossing into the adjacent
 * section when the current lesson is first or last in its own.
 */
function getAdjacentLessons(
  course: Course,
  currentLessonId: string | undefined
): { prevLesson: Lesson | null; nextLesson: Lesson | null } {
  if (!currentLessonId) {
    return { prevLesson: null, nextLesson: null }
  }

  const sectionIndex = course.sections.findIndex((section) =>
    section.lessons.some((lesson) => lesson.id === currentLessonId)
  )
  if (sectionIndex === -1) {
    return { prevLesson: null, nextLesson: null }
  }

  const section = course.sections[sectionIndex]
  const lessonIndex = section.lessons.findIndex((lesson) => lesson.id === currentLessonId)
  const prevSection = course.sections[sectionIndex - 1]
  const nextSection = course.sections[sectionIndex + 1]

  const prevLesson =
    lessonIndex > 0
      ? section.lessons[lessonIndex - 1]
      : prevSection?.lessons[prevSection.lessons.length - 1] ?? null
  const nextLesson =
    lessonIndex < section.lessons.length - 1
      ? section.lessons[lessonIndex + 1]
      : nextSection?.lessons[0] ?? null

  return { prevLesson, nextLesson }
}

export function CourseLayout({ course, currentLessonId, completedLessonIds, children }: CourseLayoutProps) {
  const { prevLesson, nextLesson } = useMemo(
    () => getAdjacentLessons(course, currentLessonId),
    [course, currentLessonId]
  )

  return (
    <div className="flex min-h-screen">
      <CourseSidebar course={course} completedLessonIds={completedLessonIds} />

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
