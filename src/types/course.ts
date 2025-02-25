export interface Course {
  id: string
  title: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  durationHours: number
  pathId: string
  sections: CourseSection[]
  prerequisites?: string[]
  learningOutcomes?: string[]
  progress?: {
    completed: number
    total: number
    lastAccessed: string
  }
  certificate?: {
    title: string
    description: string
    requirements: string[]
  }
}

export interface CourseSection {
  id: string
  title: string
  description?: string
  lessons: Lesson[]
  order: number
}

export interface Lesson {
  id: string
  title: string
  content: string
  type: "lesson" | "project" | "quiz"
  duration?: string
  completed?: boolean
  hasProject?: boolean
  githubUrl?: string
  nextLessonId?: string
  prevLessonId?: string
  knowledgeCheck?: {
    questions: {
      question: string
      options: string[]
      correctAnswer: number
      explanation: string
    }[]
  }
  assignment?: {
    description: string
    requirements: string[]
    resources?: {
      title: string
      url: string
    }[]
  }
}

export interface Path {
  id: string
  title: string
  description: string
  icon?: string
  courses: string[]
  prerequisites?: string[]
  estimatedHours?: number
  difficulty?: string
  successStories?: {
    name: string
    role: string
    company: string
    testimonial: string
    imageUrl?: string
  }[]
  certificate?: {
    title: string
    description: string
    requirements: string[]
  }
}

export interface CourseProgress {
  courseId: string
  userId: string
  completedLessons: string[]
  quizScores: {
    lessonId: string
    score: number
    maxScore: number
    completedAt: string
  }[]
  projectSubmissions: {
    lessonId: string
    repoUrl: string
    liveUrl?: string
    submittedAt: string
    feedback?: {
      comment: string
      rating: number
      reviewedBy: string
      reviewedAt: string
    }
  }[]
  lastAccessed: string
}
