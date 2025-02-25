"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Flag, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
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

interface TableOfContentsItem {
  id: string
  title: string
  level: number
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
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string
  
  const [isCompleted, setIsCompleted] = useState(false)
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Get course and lesson data
        const [courseData, lessonData] = await Promise.all([
          getCourseById(courseId),
          getLessonById(courseId, lessonId)
        ])
        
        setCourse(courseData)
        setLesson(lessonData)
        
        if (lessonData) {
          setTableOfContents(extractTableOfContents(lessonData.content))
          
          // Check if there's a knowledge check section in the content
          if (!lessonData.knowledgeCheck) {
            const knowledgeCheck = parseKnowledgeCheck(lessonData.content)
            if (knowledgeCheck) {
              // In a real app, we would update the lesson with the parsed knowledge check
              console.log("Found knowledge check:", knowledgeCheck)
            }
          }
        }
      } catch (error) {
        console.error("Error loading lesson data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [courseId, lessonId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!course || !lesson) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold">Lesson not found</h1>
        <p className="mt-4">The lesson you are looking for does not exist.</p>
        <Link href="/courses" className="mt-4 inline-block underline">
          Back to courses
        </Link>
      </div>
    )
  }

  const handleQuizComplete = (score: number) => {
    // In a real app, we would save this to the backend
    console.log(`Quiz completed with score: ${score}`)
    setIsCompleted(true)
  }

  // Sample discussions for this lesson
  const discussions = [
    {
      id: "1",
      userId: "user1",
      username: "html_learner",
      content: "I'm having trouble with the semantic HTML elements. When should I use <article> vs <section>?",
      createdAt: "2024-02-21T10:30:00Z",
      likes: 3,
      replies: [
        {
          id: "1-1",
          userId: "user2",
          username: "web_dev_teacher",
          content: "Great question! Use <article> for content that would make sense on its own (like a blog post), and <section> for grouping related content that might not stand alone.",
          createdAt: "2024-02-21T11:15:00Z",
          likes: 5
        }
      ]
    }
  ]

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
                  onClick={() => setIsCompleted(!isCompleted)}
                >
                  <CheckCircle className={`mr-2 h-4 w-4 ${isCompleted ? "text-white" : "text-muted-foreground"}`} />
                  {isCompleted ? "Completed" : "Mark as Complete"}
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
