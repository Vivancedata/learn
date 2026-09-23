"use client"

import Link from "next/link"
import useSWR from "swr"
import { CourseLayout } from "@/components/course-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProgressCircle } from "@/components/ui/progress-circle"
import { CourseCertificate } from "@/components/course-certificate"
import { CommunityDiscussions } from "@/components/community-discussions"
import { useParams } from "next/navigation"
import { Course } from "@/types/course"
import { courseDurationLabel } from "@/lib/course-duration"
import { Discussion } from "@/types/discussion"
import { useAuth } from "@/hooks/useAuth"

interface ApiDiscussionUser {
  id: string
  name: string | null
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
  const { data, isLoading, error, mutate } = useSWR(
    ['course-page', courseId, user?.id ?? 'guest'] as const,
    async ([, targetCourseId, userId]) => {
      const [coursePayload, discussionsPayload] = await Promise.all([
        // One course, not the whole catalog. A 404 is a real answer here, not
        // a failure: it means the slug does not exist.
        fetch(`/api/courses/${encodeURIComponent(targetCourseId)}`).then(async (res) => {
          if (res.status === 404) return { data: null }
          if (!res.ok) throw new Error('Failed to load course')
          return (await res.json()) as { data?: Course | null }
        }),
        fetch(`/api/discussions?courseId=${targetCourseId}`).then(async (res) => {
          if (!res.ok) throw new Error('Failed to load discussions')
          return (await res.json()) as { data?: { discussions?: ApiDiscussion[] } }
        }),
      ])

      let resolvedCourse = coursePayload.data ?? null
      let completedLessonIds: string[] = []

      if (userId !== 'guest' && resolvedCourse) {
        const [progressResponse, lessonsResponse] = await Promise.all([
          fetch(`/api/progress/user/${userId}`, { credentials: 'include' }),
          fetch(`/api/progress/lessons?userId=${userId}&courseId=${targetCourseId}`, {
            credentials: 'include',
          }),
        ])

        if (progressResponse.ok) {
          const progressData = (await progressResponse.json()).data ?? {}
          const courseProgress = progressData.courses?.find(
            (progress: { courseId: string }) => progress.courseId === targetCourseId
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

        if (lessonsResponse.ok) {
          const lessonsPayload = await lessonsResponse.json()
          completedLessonIds = lessonsPayload.data?.completedLessons?.map(
            (lesson: { id: string }) => lesson.id
          ) || []
        }
      }

      const apiDiscussions = discussionsPayload.data?.discussions || []
      const discussions: Discussion[] = apiDiscussions.map((d) => ({
        id: d.id,
        userId: d.userId,
        username: d.user.name || 'Anonymous',
        userPoints: 0,
        content: d.content,
        createdAt: d.createdAt,
        likes: d.likes,
        replies: d.replies?.map((r) => ({
          id: r.id,
          discussionId: d.id,
          userId: r.userId,
          username: r.user.name || 'Anonymous',
          userPoints: 0,
          content: r.content,
          createdAt: r.createdAt,
          likes: r.likes,
        })) || [],
      }))

      return {
        courseData: resolvedCourse,
        discussions,
        completedLessonIds,
      }
    }
  )

  const courseData = data?.courseData || null
  const discussions = data?.discussions || []
  const completedLessonIds = data?.completedLessonIds || []
  // A thrown fetch leaves `data` undefined forever, so the error must be
  // checked before the loading state or the page spins for good.
  if (error) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <h1 className="text-heading-3 font-semibold">We could not load this course</h1>
          <p className="mt-2 text-body-sm text-muted-foreground">
            Something went wrong on our side while fetching the lessons. Nothing you
            have completed has been lost.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => void mutate()}>Try Again</Button>
            <Button asChild variant="outline">
              <Link href="/courses">Back to courses</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="container space-y-6 py-8" aria-busy="true" aria-label="Loading course">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-2/3 rounded-md bg-muted" />
          <div className="h-4 w-full max-w-2xl rounded bg-muted" />
          <div className="h-4 w-3/4 max-w-2xl rounded bg-muted" />
          <div className="flex gap-4 pt-2">
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded bg-muted" />
          </div>
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
        </div>
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

  const durationLabel = courseDurationLabel(course)

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
          {durationLabel && (
            <span className="text-sm text-muted-foreground">
              {durationLabel}
            </span>
          )}
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
              {(course.learningOutcomes || defaultLearningOutcomes).map((outcome: string) => (
                <li key={outcome}>{outcome}</li>
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

        <div className="max-w-2xl">
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
        </div>

        <CommunityDiscussions 
          discussions={discussions}
          courseId={course.id}
          onRefresh={async () => {
            await mutate()
          }}
        />
      </div>
    </CourseLayout>
  )
}
