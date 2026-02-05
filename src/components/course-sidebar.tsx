"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, ChevronDown, ChevronRight, BookOpen, Code, FileQuestion } from "lucide-react"
import { Course, Lesson } from "@/types/course"

interface CourseSidebarProps {
  course: Course
  completedLessonIds?: string[]
}

export function CourseSidebar({ course, completedLessonIds = [] }: CourseSidebarProps) {
  const params = useParams()
  const lessonId = params.lessonId as string
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    // Initialize with all sections expanded
    course.sections.reduce((acc, section) => {
      acc[section.id] = true
      return acc
    }, {} as Record<string, boolean>)
  )
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }
  
  const getLessonIcon = (lesson: Lesson, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
    }
    
    switch (lesson.type) {
      case "project":
        return <Code className="h-4 w-4 text-muted-foreground" />
      case "quiz":
        return <FileQuestion className="h-4 w-4 text-muted-foreground" />
      default:
        return <BookOpen className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  const isLessonCompleted = (lesson: Lesson) => {
    if (completedLessonIds.length > 0) {
      return completedLessonIds.includes(lesson.id)
    }
    return lesson.completed || false
  }
  
  return (
    <div className="w-full">
      <div className="px-4 py-2">
        <h2 className="text-lg font-semibold">{course.title}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{course.difficulty}</span>
          <span>•</span>
          <span>{course.durationHours} hours</span>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="px-2 py-2">
          {course.sections.map((section) => (
            <div key={section.id} className="mb-2">
              <Button
                variant="ghost"
                className="w-full justify-between font-medium"
                onClick={() => toggleSection(section.id)}
              >
                <span>{section.title}</span>
                {expandedSections[section.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              
              {expandedSections[section.id] && (
                <div className="ml-2 pl-4 border-l space-y-1 py-1">
                  {section.lessons.map((lesson) => {
                    const isActive = lesson.id === lessonId
                    const isCompleted = isLessonCompleted(lesson)
                    
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.id}/${lesson.id}`}
                        className={`
                          flex items-center gap-2 px-2 py-1.5 text-sm rounded-md
                          ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}
                        `}
                      >
                        {getLessonIcon(lesson, isCompleted)}
                        <span>{lesson.title}</span>
                        {lesson.duration && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {lesson.duration}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="px-4 py-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Your Progress</span>
          <span className="text-sm text-muted-foreground">
            {course.progress ? `${Math.round((course.progress.completed / course.progress.total) * 100)}%` : '0%'}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full"
            style={{ 
              width: course.progress 
                ? `${(course.progress.completed / course.progress.total) * 100}%` 
                : '0%' 
            }}
          />
        </div>
      </div>
    </div>
  )
}
