export interface CourseSection {
  title: string
  items: CourseItem[]
}

export interface CourseItem {
  id: string
  title: string
  duration: string
  content: string
  type: 'video' | 'text' | 'quiz'
  completed?: boolean
}

export interface CourseContent {
  courseId: string
  title: string
  sections: CourseSection[]
}
