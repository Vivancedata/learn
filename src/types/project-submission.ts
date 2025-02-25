export interface ProjectSubmissionProps {
  lessonId: string
  courseId: string
  requirements?: string[]
}

export interface ProjectSubmission {
  lessonId: string
  courseId: string
  githubUrl: string
  liveUrl?: string
  notes?: string
  status: "pending" | "approved" | "rejected"
  feedback?: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}
