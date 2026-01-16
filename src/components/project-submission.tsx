"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Github, Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { ProjectSubmissionProps } from "@/types/project-submission"

interface Submission {
  id: string
  githubUrl: string
  liveUrl: string | null
  notes: string | null
  status: "pending" | "approved" | "rejected"
  feedback: string | null
  submittedAt: string
}

export function ProjectSubmission({ lessonId, requirements = [] }: ProjectSubmissionProps) {
  const [githubUrl, setGithubUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)

  // Fetch existing submission on mount
  useEffect(() => {
    async function fetchSubmission() {
      try {
        const response = await fetch(`/api/submissions?lessonId=${lessonId}`)
        if (response.ok) {
          const submissions = await response.json()
          if (submissions.length > 0) {
            const existing = submissions[0]
            setSubmission(existing)
            setGithubUrl(existing.githubUrl)
            setLiveUrl(existing.liveUrl || "")
            setNotes(existing.notes || "")
          }
        }
      } catch (err) {
        console.error("Error fetching submission:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmission()
  }, [lessonId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          githubUrl,
          liveUrl: liveUrl || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit project")
      }

      const newSubmission = await response.json()
      setSubmission(newSubmission)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = () => {
    setSubmission(null)
  }

  const handleButtonSubmit = () => {
    const form = document.getElementById("project-form") as HTMLFormElement
    if (form) {
      form.requestSubmit()
    }
  }

  const defaultRequirements = [
    "Repository must include a README.md with project description",
    "Code must be well-commented and follow best practices",
    "Application must be responsive and work on mobile devices",
    "All features described in the project brief must be implemented"
  ]

  const projectRequirements = requirements.length > 0 ? requirements : defaultRequirements

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Project Submission
        </CardTitle>
        <CardDescription>
          Submit your project for review and feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!submission ? (
          <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub Repository URL <span className="text-red-500">*</span></Label>
              <Input
                id="github-url"
                placeholder="https://github.com/yourusername/project-repo"
                value={githubUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGithubUrl(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="live-url">Live Demo URL (optional)</Label>
              <Input
                id="live-url"
                placeholder="https://your-project-demo.netlify.app"
                value={liveUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLiveUrl(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                If your project is deployed, provide a link to the live demo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes for Reviewer (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information you'd like to share about your project..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Project Requirements</h4>
              <ul className="space-y-2">
                {projectRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h4 className="font-medium">GitHub Repository</h4>
                <a
                  href={submission.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Github className="h-3.5 w-3.5" />
                  {submission.githubUrl.replace("https://github.com/", "")}
                </a>
              </div>

              {submission.liveUrl && (
                <div className="flex-1">
                  <h4 className="font-medium">Live Demo</h4>
                  <a
                    href={submission.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {submission.liveUrl.replace(/(https?:\/\/)?(www\.)?/, "")}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Submission Status</h4>
                {submission.status === "pending" && (
                  <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">
                    Pending Review
                  </Badge>
                )}
                {submission.status === "approved" && (
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                    Approved
                  </Badge>
                )}
                {submission.status === "rejected" && (
                  <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
                    Needs Improvement
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Submitted {new Date(submission.submittedAt).toLocaleDateString()}
              </p>

              {submission.feedback && (
                <div className="bg-muted p-3 rounded-md">
                  <h5 className="text-sm font-medium mb-1">Reviewer Feedback</h5>
                  <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!submission ? (
          <>
            <Button variant="outline" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleButtonSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Project
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleEdit}>
              Edit Submission
            </Button>
            <Button variant="outline" disabled>
              Request Peer Review
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
