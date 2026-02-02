"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Github, Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { useAuth } from "@/hooks/useAuth"

import { ProjectSubmissionProps } from "@/types/project-submission"

// GitHub URL regex pattern matching the backend validation
const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/

export function ProjectSubmission({ lessonId, courseId: _courseId, requirements = [] }: ProjectSubmissionProps) {
  const { user, loading: authLoading } = useAuth()
  const [githubUrl, setGithubUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingExisting, setFetchingExisting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<"pending" | "approved" | "rejected" | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  // Fetch existing submission for this lesson on mount
  const fetchExistingSubmission = useCallback(async () => {
    if (!user?.id || !lessonId) {
      setFetchingExisting(false)
      return
    }

    try {
      setFetchingExisting(true)
      const response = await fetch(
        `/api/projects?userId=${encodeURIComponent(user.id)}&lessonId=${encodeURIComponent(lessonId)}`,
        {
          credentials: 'include',
        }
      )

      if (response.ok) {
        const data = await response.json()
        const submissions = data.data

        if (submissions && submissions.length > 0) {
          const existingSubmission = submissions[0]
          setGithubUrl(existingSubmission.githubUrl || "")
          setLiveUrl(existingSubmission.liveUrl || "")
          setNotes(existingSubmission.notes || "")
          setSubmissionStatus(existingSubmission.status)
          setFeedback(existingSubmission.feedback || null)
          setSubmissionId(existingSubmission.id)
          setSubmitted(true)
        }
      }
    } catch (err) {
      console.error('Failed to fetch existing submission:', err)
    } finally {
      setFetchingExisting(false)
    }
  }, [user?.id, lessonId])

  useEffect(() => {
    if (!authLoading && user) {
      fetchExistingSubmission()
    } else if (!authLoading && !user) {
      setFetchingExisting(false)
    }
  }, [authLoading, user, fetchExistingSubmission])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate user is authenticated
    if (!user) {
      setError("You must be logged in to submit a project")
      return
    }

    // Validate GitHub URL using the same pattern as the backend
    if (!GITHUB_URL_REGEX.test(githubUrl)) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)")
      return
    }

    // Validate live URL if provided
    if (liveUrl && !isValidUrl(liveUrl)) {
      setError("Please enter a valid URL for the live demo")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Submit project to backend API (auth via HTTP-only cookie)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HTTP-only auth cookie
        body: JSON.stringify({
          userId: user.id,
          lessonId,
          githubUrl,
          liveUrl: liveUrl || undefined,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit project')
      }

      const data = await response.json()

      setSubmitted(true)
      setSubmissionStatus(data.data.status)
      setFeedback(data.data.feedback || null)
      setSubmissionId(data.data.submissionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to validate URLs
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
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

  // Handle switching to edit mode
  const handleEditSubmission = () => {
    setSubmitted(false)
    setError(null)
  }

  // Show loading state while checking for existing submission or auth
  if (authLoading || fetchingExisting) {
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show login prompt if user is not authenticated
  if (!user) {
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Please sign in to submit your project.
            </p>
          </div>
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
          {submissionId && (
            <span className="text-xs font-normal text-muted-foreground">
              (Resubmission)
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {submitted
            ? "Your project has been submitted for review"
            : submissionId
              ? "Update your project submission"
              : "Submit your project for review and feedback"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!submitted ? (
          <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub Repository URL <span className="text-destructive">*</span></Label>
              <Input
                id="github-url"
                placeholder="https://github.com/yourusername/project-repo"
                value={githubUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGithubUrl(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="live-url">Live Demo URL (optional)</Label>
              <Input
                id="live-url"
                placeholder="https://your-project-demo.netlify.app"
                value={liveUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLiveUrl(e.target.value)}
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
              />
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2">
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
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-info hover:underline flex items-center gap-1"
                >
                  <Github className="h-3.5 w-3.5" />
                  {githubUrl.replace("https://github.com/", "")}
                </a>
              </div>

              {liveUrl && (
                <div className="flex-1">
                  <h4 className="font-medium">Live Demo</h4>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-info hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {liveUrl.replace(/(https?:\/\/)?(www\.)?/, "")}
                  </a>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Submission Status</h4>
                {submissionStatus === "pending" && (
                  <StatusBadge status="pending">Pending Review</StatusBadge>
                )}
                {submissionStatus === "approved" && (
                  <StatusBadge status="success">Approved</StatusBadge>
                )}
                {submissionStatus === "rejected" && (
                  <StatusBadge status="error">Needs Improvement</StatusBadge>
                )}
              </div>
              
              {feedback && (
                <div className="bg-muted p-3 rounded-md">
                  <h5 className="text-sm font-medium mb-1">Reviewer Feedback</h5>
                  <p className="text-sm text-muted-foreground">{feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!submitted ? (
          <>
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={() => {
                // Reset form if user cancels
                if (submissionId) {
                  // If editing, go back to submitted view
                  setSubmitted(true)
                } else {
                  // If new submission, clear form
                  setGithubUrl("")
                  setLiveUrl("")
                  setNotes("")
                  setError(null)
                }
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleButtonSubmit} disabled={loading || !githubUrl}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : submissionId ? (
                'Update Submission'
              ) : (
                'Submit Project'
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleEditSubmission}>
              {submissionStatus === 'rejected' ? 'Resubmit Project' : 'Edit Submission'}
            </Button>
            <Button variant="outline" disabled>Request Peer Review</Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
