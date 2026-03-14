import type { Metadata } from 'next'
import CoursePageClient from './page-client'

export const metadata: Metadata = {
  title: 'Course | Vivance',
  description: 'Explore lessons, discussions, and progress for this course.',
}

export default function CoursePage() {
  return <CoursePageClient />
}
