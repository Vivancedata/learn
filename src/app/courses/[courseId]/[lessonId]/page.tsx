"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Flag, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ProjectSubmission } from "@/components/project-submission"
import { KnowledgeCheck } from "@/components/knowledge-check"
import { CommunityDiscussions } from "@/components/community-discussions"
import { getCourseById, getLessonById, parseKnowledgeCheck } from "@/lib/content"
import type { Components } from "react-markdown"
import { useParams } from "next/navigation"
import { Course, Lesson } from "@/types/course"
import { useAuth } from "@/hooks/useAuth"
import { PageSpinner } from "@/components/ui/spinner"

interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

interface DiscussionReply {
  id: string
  userId: string
  user: { name: string | null; email: string }
  content: string
  createdAt: string
  likes: number
}

interface DiscussionData {
  id: string
  userId: string
  user: { name: string | null; email: string }
  content: string
  createdAt: string
  likes: number
  replies?: DiscussionReply[]
}

interface TransformedDiscussion {
  id: string
  userId: string
  username: string
  content: string
  createdAt: string
  likes: number
  replies: {
    id: string
    userId: string
    username: string
    content: string
    createdAt: string
    likes: number
  }[]
}

interface CourseProgressData {
  courseId: string
}

function extractTableOfContents(content: string): TableOfContentsItem[] {
  const headings = content.match(/^#{1,6}\s+.+$/gm) || []
  return headings.map(heading => {
    const level = heading.match(/^#+/)?.[0].length || 1
    const title = heading.replace(/^#+\s+/, '')
    const id = title.toLowerCase().replace(/[^\w]+/g, '-')
    return { id, title, level }
  })
}

const markdownComponents: Components = {
  h1: (props) => <h1 className="mt-2" {...props} />,
  pre: (props) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props} />
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className
    return (
      <code 
        className={isInline ? "bg-muted px-1 py-0.5 rounded" : ""} 
        {...props}
      >
        {children}
      </code>
    )
  }
}

export default function LessonPage() {
  const { user } = useAuth()
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string

  const [isCompleted, setIsCompleted] = useState(false)
  const [completionLoading, setCompletionLoading] = useState(false)
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [discussions, setDiscussions] = useState<TransformedDiscussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // Prepare promises
        const promises = [
          getCourseById(courseId),
          getLessonById(courseId, lessonId),
          fetch(`/api/discussions?lessonId=${lessonId}`).then(res => res.json()),
        ]

        // If user is logged in, also fetch their progress
        if (user) {
          const token = localStorage.getItem('token')
          if (token) {
            promises.push(
              fetch(`/api/progress/user/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }).then(res => res.json())
            )
          }
        }

        // Get course, lesson, discussions, and optionally progress data
        const results = await Promise.allSettled(promises)
        const [courseResult, lessonResult, discussionsResult, progressResult] = results

        // Handle course result
        if (courseResult.status === 'fulfilled') {
          setCourse(courseResult.value)
        } else {
          setError('Failed to load course information')
        }

        // Handle lesson result
        if (lessonResult.status === 'fulfilled') {
          const lessonData = lessonResult.value
          setLesson(lessonData)

          if (lessonData) {
            setTableOfContents(extractTableOfContents(lessonData.content))

            // Check if there's a knowledge check section in the content
            if (!lessonData.knowledgeCheck) {
              parseKnowledgeCheck(lessonData.content)
            }
          }
        } else {
          setError('Failed to load lesson content')
        }

        // Handle discussions result
        if (discussionsResult.status === 'fulfilled') {
          // Transform backend data to match component expectations
          const transformedDiscussions = discussionsResult.value.data?.map((d: DiscussionData) => ({
            id: d.id,
            userId: d.userId,
            username: d.user.name || d.user.email.split('@')[0],
            content: d.content,
            createdAt: d.createdAt,
            likes: d.likes,
            replies: d.replies?.map((r: DiscussionReply) => ({
              id: r.id,
              userId: r.userId,
              username: r.user.name || r.user.email.split('@')[0],
              content: r.content,
              createdAt: r.createdAt,
              likes: r.likes,
            })) || [],
          })) || []
          setDiscussions(transformedDiscussions)
        }

        // Handle progress result - check if this lesson is completed
        if (progressResult && progressResult.status === 'fulfilled') {
          const userProgress = progressResult.value
          // Find the course progress that contains this lesson
          const courseProgress = userProgress.courses?.find((c: CourseProgressData) => c.courseId === courseId)
          if (courseProgress) {
            // Check if we have a way to get completed lesson IDs from the API
            // For now, we'll fetch it separately when needed
            // This would require updating the progress API to return lesson IDs
          }
        }
      } catch {
        setError('An unexpected error occurred while loading lesson data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId, lessonId, user])

  if (loading) {
    return <PageSpinner />
  }

  if (error || !course || !lesson) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold">{error ? 'Error Loading Lesson' : 'Lesson not found'}</h1>
        <p className="mt-4 text-destructive">{error || 'The lesson you are looking for does not exist.'}</p>
        <div className="mt-6 space-x-4">
          <Link href="/courses" className="inline-block underline">
            Back to courses
          </Link>
          {error && (
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  const handleMarkComplete = async () => {
    if (!user) {
      setError("You must be logged in to track progress")
      return
    }

    if (isCompleted) {
      // Already completed, just toggle UI
      setIsCompleted(false)
      return
    }

    setCompletionLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch('/api/progress/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId,
          completed: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to mark lesson as complete')
      }

      setIsCompleted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark lesson as complete')
    } finally {
      setCompletionLoading(false)
    }
  }

  const handleQuizComplete = async (score: number) => {
    if (!user) {
      setError("You must be logged in to save quiz scores")
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId,
          score,
          maxScore: 100,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit quiz score')
      }

      // Mark lesson as completed
      setIsCompleted(true)

      // Also mark the lesson as complete via the progress API
      await fetch('/api/progress/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId,
          completed: true,
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz score')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
                <Button
                  variant={isCompleted ? "default" : "outline"}
                  onClick={handleMarkComplete}
                  disabled={completionLoading}
                >
                  {completionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className={`mr-2 h-4 w-4 ${isCompleted ? "text-white" : "text-muted-foreground"}`} />
                      {isCompleted ? "Completed" : "Mark as Complete"}
                    </>
                  )}
                </Button>
              </div>

              <Card>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none p-6">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {lesson.content}
                  </ReactMarkdown>
                </CardContent>
              </Card>

              {lesson.knowledgeCheck && (
                <KnowledgeCheck 
                  questions={lesson.knowledgeCheck.questions}
                  onComplete={handleQuizComplete}
                />
              )}

              {lesson.type === "project" && (
                <ProjectSubmission 
                  lessonId={lessonId}
                  courseId={courseId}
                />
              )}

              <CommunityDiscussions 
                discussions={discussions}
                courseId={courseId}
                lessonId={lessonId}
              />

              <div className="flex items-center justify-between border-t pt-6">
                <div className="space-x-4">
                  <Button variant="outline" asChild>
                    <Link 
                      href={`https://github.com/yourusername/eureka/tree/main/content/courses/${courseId}/lessons/${lessonId}.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      Improve this lesson
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link 
                      href={`https://github.com/yourusername/eureka/issues/new?title=Issue with ${lesson.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report an issue
                    </Link>
                  </Button>
                </div>

                <div className="space-x-2">
                  {lesson.prevLessonId && (
                    <Button variant="outline" asChild>
                      <Link href={`/courses/${courseId}/${lesson.prevLessonId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Link>
                    </Button>
                  )}
                  {lesson.nextLessonId && (
                    <Button asChild>
                      <Link href={`/courses/${courseId}/${lesson.nextLessonId}`}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents Sidebar */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20">
              <h3 className="font-semibold mb-4">Table of Contents</h3>
              <div className="h-[calc(100vh-12rem)] overflow-auto">
                <nav className="space-y-1">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`
                        block text-sm py-1 text-muted-foreground hover:text-foreground transition-colors
                        ${item.level === 1 ? "font-medium" : "pl-4"}
                      `}
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
