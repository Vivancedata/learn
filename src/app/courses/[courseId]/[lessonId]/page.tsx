"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Flag, ArrowLeft, ArrowRight, CheckCircle, Loader2, MessageSquare } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ProjectSubmission } from "@/components/project-submission"
import { KnowledgeCheck } from "@/components/knowledge-check"
import { CommunityDiscussions } from "@/components/community-discussions"
import { StudentSolutions } from "@/components/student-solutions"
import { parseKnowledgeCheck } from "@/lib/content-utils"
import type { Components } from "react-markdown"
import { useParams } from "next/navigation"
import { Course, Lesson } from "@/types/course"
import { useAuth } from "@/hooks/useAuth"
import { PageSpinner } from "@/components/ui/spinner"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { InteractiveCodeBlock, parseCodeBlockLanguage } from "@/components/interactive-code-block"
import { useAiTutor } from "@/hooks/useAiTutor"
import { AiTutorButton } from "@/components/ai-tutor/chat-container"

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
  userPoints: number
  content: string
  createdAt: string
  likes: number
  replies: {
    id: string
    discussionId: string
    userId: string
    username: string
    userPoints: number
    content: string
    createdAt: string
    likes: number
  }[]
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

/**
 * Creates markdown components with support for interactive code blocks
 * Code blocks marked with 'interactive' (e.g., ```python interactive)
 * will be rendered as full code playgrounds
 */
function createMarkdownComponents(): Components {
  return {
    h1: (props) => <h1 className="mt-2" {...props} />,
    h2: ({ children, ...props }) => {
      const id = String(children).toLowerCase().replace(/[^\w]+/g, '-')
      return <h2 id={id} {...props}>{children}</h2>
    },
    h3: ({ children, ...props }) => {
      const id = String(children).toLowerCase().replace(/[^\w]+/g, '-')
      return <h3 id={id} {...props}>{children}</h3>
    },
    // Handle pre tags - pass through to let code handle it
    pre: ({ children }) => <>{children}</>,
    // Handle code blocks with interactive support
    code: ({ className, children, ...props }) => {
      // Extract language from className (e.g., "language-python" or "language-python-interactive")
      const match = /language-(\S+)/.exec(className || '')

      // Check if this is an inline code block (no language class)
      const isInline = !match

      if (isInline) {
        return (
          <code
            className="bg-muted px-1 py-0.5 rounded text-sm"
            {...props}
          >
            {children}
          </code>
        )
      }

      // Parse the language string for interactive flag
      const fullLang = match[1] || ''
      const { language, interactive } = parseCodeBlockLanguage(fullLang)
      const code = String(children).replace(/\n$/, '')

      // Render as interactive code block for Python
      return (
        <InteractiveCodeBlock
          code={code}
          language={language}
          interactive={interactive}
        />
      )
    }
  }
}

function LessonContent() {
  const { user } = useAuth()
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string
  const { setLessonContext } = useAiTutor()

  const [isCompleted, setIsCompleted] = useState(false)
  const [completionLoading, setCompletionLoading] = useState(false)
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [discussions, setDiscussions] = useState<TransformedDiscussion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize markdown components to avoid re-creation on every render
  const markdownComponents = useMemo(() => createMarkdownComponents(), [])

  const fetchDiscussions = useCallback(async () => {
    const response = await fetch(`/api/discussions?lessonId=${lessonId}`)
    const payload = await response.json()
    const transformedDiscussions = payload.data?.discussions?.map((d: DiscussionData) => ({
      id: d.id,
      userId: d.userId,
      username: d.user.name || d.user.email.split('@')[0],
      userPoints: 0,
      content: d.content,
      createdAt: d.createdAt,
      likes: d.likes,
      replies: d.replies?.map((r: DiscussionReply) => ({
        id: r.id,
        discussionId: d.id,
        userId: r.userId,
        username: r.user.name || r.user.email.split('@')[0],
        userPoints: 0,
        content: r.content,
        createdAt: r.createdAt,
        likes: r.likes,
      })) || [],
    })) || []
    setDiscussions(transformedDiscussions)
  }, [lessonId])

  useEffect(() => {
    async function loadData() {
      try {
        // Prepare promises - use API routes instead of direct Prisma imports
        const promises: Promise<unknown>[] = [
          fetch('/api/courses').then(res => res.ok ? res.json() : { data: [] }).then(d => {
            const courses: Course[] = d.data || []
            return courses.find(c => c.id === courseId) || null
          }),
          fetch(`/api/lessons/${lessonId}`).then(res => res.ok ? res.json() : { data: null }).then(d => d.data || null),
          fetchDiscussions(),
        ]

        // If user is logged in, also fetch their lesson progress
        if (user) {
          promises.push(
            fetch(`/api/progress/lessons?userId=${user.id}&courseId=${courseId}`, {
              credentials: 'include',
            }).then(res => res.json())
          )
        }

        // Get course, lesson, and optionally progress data
        const results = await Promise.allSettled(promises)
        const [courseResult, lessonResult, discussionsResult, progressResult] = results

        // Handle course result
        if (courseResult.status === 'fulfilled') {
          setCourse(courseResult.value as Course)
        } else {
          setError('Failed to load course information')
        }

        // Handle lesson result
        if (lessonResult.status === 'fulfilled') {
          const lessonData = lessonResult.value as Lesson
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
        if (discussionsResult.status === 'rejected') {
          console.error('Failed to load discussions:', discussionsResult.reason)
        }

        // Handle progress result - check if this lesson is completed
        if (progressResult && progressResult.status === 'fulfilled') {
          const progressPayload = progressResult.value as { data?: { completedLessons?: { id: string }[] } }
          const completedLessonIds = progressPayload.data?.completedLessons?.map((lesson) => lesson.id) || []
          setIsCompleted(completedLessonIds.includes(lessonId))
        }
      } catch {
        setError('An unexpected error occurred while loading lesson data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId, fetchDiscussions, lessonId, user])

  // Set AI Tutor context when lesson loads
  useEffect(() => {
    if (course && lesson) {
      setLessonContext({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseId: course.id,
        courseName: course.title,
        currentTopic: lesson.title,
      })
    }
  }, [course, lesson, setLessonContext])

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
      const response = await fetch('/api/progress/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          courseId,
          lessonId,
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

  const handleQuizComplete = async (result: { score: number; selectedAnswers: number[] }) => {
    if (!user) {
      setError("You must be logged in to save quiz scores")
      return
    }

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          courseId,
          lessonId,
          answers: result.selectedAnswers,
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
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          courseId,
          lessonId,
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz score')
    }
  }

  const repositoryUrl =
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/vivancedata/learn'
  const issueTitle = encodeURIComponent(`Issue with ${lesson.title}`)
  const lessonContentPath = `content/courses/${courseId}/lessons/${lessonId}.md`

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="space-y-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
                <div className="flex items-center gap-2">
                  <AiTutorButton
                    label="Ask AI"
                    variant="outline"
                    size="default"
                    prefillMessage={`Help me understand ${lesson.title}`}
                  />
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
                <>
                  <ProjectSubmission
                    lessonId={lessonId}
                    courseId={courseId}
                  />
                  <StudentSolutions
                    lessonId={lessonId}
                    courseId={courseId}
                  />
                </>
              )}

              <CommunityDiscussions
                discussions={discussions}
                courseId={courseId}
                lessonId={lessonId}
                onRefresh={fetchDiscussions}
              />

              <div className="flex items-center justify-between border-t pt-6">
                <div className="space-x-4">
                  <Button variant="outline" asChild>
                    <Link 
                      href={`${repositoryUrl}/tree/main/${lessonContentPath}`}
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
                      href={`${repositoryUrl}/issues/new?title=${issueTitle}`}
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
              <div className="h-[calc(100vh-16rem)] overflow-auto">
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
              {/* AI Tutor Help Card */}
              <div className="mt-6 p-4 rounded-lg border border-border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">Need Help?</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Ask the AI Tutor any questions about this lesson.
                </p>
                <AiTutorButton
                  label="Ask AI Tutor"
                  variant="default"
                  size="sm"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LessonPage() {
  return (
    <ProtectedRoute>
      <LessonContent />
    </ProtectedRoute>
  )
}
