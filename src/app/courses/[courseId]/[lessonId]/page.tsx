import type { Metadata } from 'next'
import LessonPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Lesson | Vivance',
  description: 'Study lesson content, complete activities, and join discussions.',
}

export default function LessonPage() {
  return <LessonPageClient />
}
