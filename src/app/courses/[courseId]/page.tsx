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
import { Discussion } from "@/types/discussion"
import { useAuth } from "@/hooks/useAuth"

interface ApiDiscussionUser {
  id: string
  name: string | null
  email: string
}

interface ApiDiscussionReply {
  id: string
  userId: string
  user: ApiDiscussionUser
  content: string
  createdAt: string
  likes: number
}

interface ApiDiscussion {
  id: string
  userId: string
  user: ApiDiscussionUser
  content: string
  createdAt: string
  likes: number
  replies?: ApiDiscussionReply[]
}

export default function CoursePage() {
  const params = useParams()
  const courseId = params.courseId as string
  const { user } = useAuth()
  const [courseData, setCourseData] = useState<Course | null>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDiscussions = async () => {
    const response = await fetch(`/api/discussions?courseId=${courseId}`)
    const payload = await response.json()
    const apiDiscussions: ApiDiscussion[] = payload.data?.discussions || []
    const transformedDiscussions: Discussion[] = apiDiscussions.map((d) => ({
      id: d.id,
      userId: d.userId,
      username: d.user.name || d.user.email.split('@')[0],
      content: d.content,
      createdAt: d.createdAt,
      likes: d.likes,
      replies: d.replies?.map((r) => ({
        id: r.id,
        userId: r.userId,
        username: r.user.name || r.user.email.split('@')[0],
        content: r.content,
        createdAt: r.createdAt,
        likes: r.likes,
      })) || [],
    }))
    setDiscussions(transformedDiscussions)
  }

  useEffect(() => {
    async function loadCourse() {
      try {
        const [course, discussionsResult] = await Promise.allSettled([
          getCourseById(courseId),
          fetchDiscussions(),
        ])

        if (course.status === 'fulfilled') {
          let resolvedCourse = course.value

          if (user) {
            const progressResponse = await fetch(`/api/progress/user/${user.id}`, {
              credentials: 'include',
            })

            if (progressResponse.ok) {
              const progressData = await progressResponse.json()
              const courseProgress = progressData.courses?.find(
                (progress: { courseId: string }) => progress.courseId === courseId
              )

              if (courseProgress) {
                resolvedCourse = {
                  ...resolvedCourse,
                  progress: {
                    completed: courseProgress.completedLessons,
                    total: courseProgress.totalLessons,
                    lastAccessed: courseProgress.lastAccessed,
                  },
                }
              }
            }

            const lessonsResponse = await fetch(
              `/api/progress/lessons?userId=${user.id}&courseId=${courseId}`,
              { credentials: 'include' }
            )

            if (lessonsResponse.ok) {
              const lessonsPayload = await lessonsResponse.json()
              const lessonIds = lessonsPayload.data?.completedLessons?.map(
                (lesson: { id: string }) => lesson.id
              ) || []
              setCompletedLessonIds(lessonIds)
            }
          }

          setCourseData(resolvedCourse)
        }

        if (discussionsResult.status === 'rejected') {
          console.error('Failed to load discussions:', discussionsResult.reason)
        }
      } catch (error) {
        console.error("Error loading course:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId, user])
  
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
    progress: courseData.progress,
    learningOutcomes: courseData.learningOutcomes || [
      "Understand core concepts and principles",
      "Build practical projects to apply your knowledge",
      "Master essential tools and techniques",
      "Develop problem-solving skills in the domain"
    ]
  }
  
  const progress = course.progress ? (course.progress.completed / course.progress.total) * 100 : 0

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

  // Calculate progress metrics for certificate
  const totalLessons = course.sections.reduce((acc, section) => acc + section.lessons.length, 0)
  const projectLessons = course.sections.reduce(
    (acc, section) => acc + section.lessons.filter(l => l.type === "project").length, 
    0
  )
  
  const progressMetrics = {
    completedLessons: course.progress?.completed || 0,
    totalLessons,
    completedProjects: 0,
    totalProjects: projectLessons,
    averageQuizScore: 0,
  }

  // Default learning outcomes if not provided
  const defaultLearningOutcomes = [
    "Understand core concepts and principles",
    "Build practical projects to apply your knowledge",
    "Master essential tools and techniques",
    "Develop problem-solving skills in the domain"
  ]

  return (
    <CourseLayout course={course} completedLessonIds={completedLessonIds}>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              {course.description}
            </p>
          </div>
          {course.progress && (
            <ProgressCircle 
              progress={progress}
              size="lg"
              showPercentage
            />
          )}
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
                  {section.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.id}/${lesson.id}`}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{lesson.title}</span>
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
                  ))}
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
          onRefresh={fetchDiscussions}
        />
      </div>
    </CourseLayout>
  )
}
