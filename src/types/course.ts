export interface CourseProgressSummary {
  completed: number
  total: number
  lastAccessed: string
}

/**
 * The subset of a course a catalog card actually renders. Both the full
 * `Course` (course detail) and the lighter `CourseCatalogEntry` (list
 * endpoint) satisfy this, so `CourseList` can be fed by either.
 */
export interface CourseCardData {
  id: string
  title: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  durationHours: number
  prerequisites?: string[]
  lessonCount?: number
  sections?: { lessons: { duration?: string }[] }[]
  progress?: CourseProgressSummary
}

/** A lesson as it appears in the catalog listing: no body, just the label. */
export interface CourseCatalogLesson {
  id: string
  title: string
  type: "lesson" | "project" | "quiz"
  duration?: string
}

export interface CourseCatalogSection {
  id: string
  title: string
  description?: string
  order: number
  lessons: CourseCatalogLesson[]
}

/**
 * What `GET /api/courses` returns. Deliberately excludes lesson bodies,
 * transcripts and video metadata: the catalog never renders them, and
 * shipping them made the response half a megabyte.
 */
export interface CourseCatalogEntry extends CourseCardData {
  pathId: string
  learningOutcomes?: string[]
  sectionCount: number
  lessonCount: number
  sections: CourseCatalogSection[]
}

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
  progress?: CourseProgressSummary
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

export type VideoProvider = "YOUTUBE" | "VIMEO" | "WISTIA" | "SELF_HOSTED"

export interface VideoChapter {
  title: string
  startTime: number // in seconds
  endTime?: number  // in seconds
}

export interface VideoProgress {
  lessonId: string
  userId: string
  watchedSeconds: number
  totalSeconds: number
  completed: boolean
  lastWatched: string
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
  // Video content fields
  videoUrl?: string
  videoDuration?: number // in seconds
  videoProvider?: VideoProvider
  videoTranscript?: string
  videoChapters?: VideoChapter[]
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
