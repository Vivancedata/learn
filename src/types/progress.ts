import { Course, Path } from "@/types/course"

export interface ProgressSummaryProps {
  courses?: Course[]
  paths?: Path[]
  totalCourses?: number
  completedCourses?: number
  totalLessons?: number
  completedLessons?: number
}

export interface UserProgress {
  userId: string
  courseProgress: {
    courseId: string
    completedLessons: string[]
    lastAccessed: string
  }[]
  pathProgress: {
    pathId: string
    completedCourses: string[]
    startedAt: string
    lastAccessed: string
  }[]
  achievements: {
    id: string
    name: string
    earnedAt: string
  }[]
  totalTimeSpent: number // in minutes
  streak: {
    current: number
    longest: number
    lastActive: string
  }
}
