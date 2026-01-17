"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Github, Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { StatusBadge } from "../components/ui/status-badge"
import { useAuth } from "@/hooks/useAuth"

import { ProjectSubmissionProps } from "@/types/project-submission"

export function ProjectSubmission({ lessonId, courseId, requirements = [] }: ProjectSubmissionProps) {
  const { user } = useAuth()
  const [githubUrl, setGithubUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<"pending" | "approved" | "rejected" | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate user is authenticated
    if (!user) {
      setError("You must be logged in to submit a project")
      return
    }

    // Validate GitHub URL
    if (!githubUrl.includes("github.com")) {
      setError("Please enter a valid GitHub repository URL")
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project')
    } finally {
      setLoading(false)
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
        {!submitted ? (
          <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub Repository URL <span className="text-red-500">*</span></Label>
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
            <Button variant="outline" type="button" disabled={loading}>Cancel</Button>
            <Button type="button" onClick={handleButtonSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Project'
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setSubmitted(false)}>Edit Submission</Button>
            <Button variant="outline">Request Peer Review</Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
