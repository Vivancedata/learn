import { Course } from "@/types/course"

export interface CourseCertificateProps {
  course: Course
  progress: {
    completedLessons: number
    totalLessons: number
    completedProjects: number
    totalProjects: number
    averageQuizScore: number
  }
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  courseName: string
  issueDate: string
  expiryDate?: string
  verificationCode: string
  skills: string[]
}

export interface CertificateRequirements {
  lessons: boolean
  projects: boolean
  quizzes: boolean
}
