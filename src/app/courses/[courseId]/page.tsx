"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CourseLayout } from "@/components/course-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { CourseCertificate } from "@/components/course-certificate"
import { SuccessStories } from "@/components/success-stories"
import { CommunityDiscussions } from "@/components/community-discussions"
import { getCourseById } from "@/lib/content"
import { useParams } from "next/navigation"
import { Course } from "@/types/course"
import { useProgress } from "@/lib/hooks/use-progress"
import { CheckCircle } from "lucide-react"

export default function CoursePage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [courseData, setCourseData] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  // Use progress tracking hook
  const { progress, isLessonComplete } = useProgress(courseId)

  useEffect(() => {
    async function loadCourse() {
      try {
        const course = await getCourseById(courseId)
        setCourseData(course)
      } catch (error) {
        console.error("Error loading course:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId])
  
  // Show loading state
  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold">Loading course...</h1>
      </div>
    )
  }
  
  // Fallback if course not found
  if (!courseData) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold">Course not found</h1>
        <p className="mt-4">The course you are looking for does not exist.</p>
        <Link href="/courses" className="mt-4 inline-block underline">
          Back to courses
        </Link>
      </div>
    )
  }

  // Add missing properties to match the CourseType interface
  const course = {
    ...courseData,
    progress: progress ? {
      completed: progress.completedCount,
      total: progress.totalLessons,
      lastAccessed: progress.lastAccessed || new Date().toISOString()
    } : {
      completed: 0,
      total: courseData.sections.reduce((acc, s) => acc + s.lessons.length, 0),
      lastAccessed: new Date().toISOString()
    },
    learningOutcomes: courseData.learningOutcomes || [
      "Understand core concepts and principles",
      "Build practical projects to apply your knowledge",
      "Master essential tools and techniques",
      "Develop problem-solving skills in the domain"
    ]
  }

  const progressPercent = progress?.percentComplete || 0

  // Sample success stories
  const successStories = [
    {
      name: "Sarah Johnson",
      role: "Frontend Developer",
      company: "TechCorp",
      testimonial: "This course was exactly what I needed to transition into web development. The project-based approach helped me build a portfolio that landed me my first dev job!"
    },
    {
      name: "Michael Chen",
      role: "Full Stack Engineer",
      company: "StartupX",
      testimonial: "I had tried learning web development on my own before, but this structured approach with clear explanations made all the difference. Highly recommended!"
    },
    {
      name: "Priya Patel",
      role: "UI Developer",
      company: "DesignHub",
      testimonial: "The HTML and CSS sections were incredibly thorough. I went from knowing nothing about web development to building responsive websites in just a few weeks."
    }
  ]

  // Sample discussions
  const discussions = [
    {
      id: "1",
      userId: "user1",
      username: "webdev_newbie",
      content: "I'm struggling with the CSS flexbox concept. Any tips on how to visualize it better?",
      createdAt: "2024-02-20T14:30:00Z",
      likes: 5,
      replies: [
        {
          id: "1-1",
          userId: "user2",
          username: "css_master",
          content: "Try using the Flexbox Froggy game - it's a fun way to learn flexbox concepts!",
          createdAt: "2024-02-20T15:45:00Z",
          likes: 8
        },
        {
          id: "1-2",
          userId: "user3",
          username: "dev_mentor",
          content: "I found that drawing boxes on paper and then trying to arrange them helped me understand the concept better.",
          createdAt: "2024-02-21T09:15:00Z",
          likes: 3
        }
      ]
    },
    {
      id: "2",
      userId: "user4",
      username: "js_enthusiast",
      content: "Just completed the JavaScript section and I'm amazed at how much I've learned! The exercises were challenging but rewarding.",
      createdAt: "2024-02-22T11:20:00Z",
      likes: 12,
      replies: []
    }
  ]

  // Calculate progress metrics for certificate
  const totalLessons = course.sections.reduce((acc, section) => acc + section.lessons.length, 0)
  const projectLessons = course.sections.reduce(
    (acc, section) => acc + section.lessons.filter(l => l.type === "project").length,
    0
  )

  // Count completed projects
  const completedProjects = course.sections.reduce((acc, section) => {
    return acc + section.lessons.filter(l => l.type === "project" && isLessonComplete(l.id)).length
  }, 0)

  const progressMetrics = {
    completedLessons: progress?.completedCount || 0,
    totalLessons,
    completedProjects,
    totalProjects: projectLessons,
    averageQuizScore: 85 // TODO: Calculate from actual quiz scores
  }

  // Default learning outcomes if not provided
  const defaultLearningOutcomes = [
    "Understand core concepts and principles",
    "Build practical projects to apply your knowledge",
    "Master essential tools and techniques",
    "Develop problem-solving skills in the domain"
  ]

  return (
    <CourseLayout course={course}>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              {course.description}
            </p>
          </div>
          <ProgressCircle
            progress={progressPercent}
            size="lg"
            showPercentage
          />
        </div>

        <div className="flex gap-4">
          <Badge>{course.difficulty}</Badge>
          <span className="text-sm text-muted-foreground">
            {course.durationHours} hours
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What You&apos;ll Learn</CardTitle>
            <CardDescription>
              Key skills and knowledge you&apos;ll gain from this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              {(course.learningOutcomes || defaultLearningOutcomes).map((outcome: string, index: number) => (
                <li key={index}>{outcome}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {course.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                {section.description && (
                  <CardDescription>{section.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.lessons.map((lesson) => {
                    const completed = isLessonComplete(lesson.id)
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.id}/${lesson.id}`}
                        className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                          )}
                          <span className={completed ? "text-muted-foreground" : ""}>{lesson.title}</span>
                          {lesson.type === "project" && (
                            <Badge variant="outline">Project</Badge>
                          )}
                        </div>
                        {lesson.duration && (
                          <span className="text-sm text-muted-foreground">
                            {lesson.duration}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CourseCertificate 
            course={{
              ...course,
              certificate: {
                title: `${course.title} Certificate`,
                description: `This certificate verifies that you have successfully completed the ${course.title} course, demonstrating proficiency in the core concepts and skills.`,
                requirements: [
                  "Complete all course lessons",
                  "Submit all required projects",
                  "Pass all quizzes with a score of 70% or higher"
                ]
              }
            }}
            progress={progressMetrics}
          />
          
          <SuccessStories stories={successStories} />
        </div>

        <CommunityDiscussions 
          discussions={discussions}
          courseId={course.id}
        />
      </div>
    </CourseLayout>
  )
}
