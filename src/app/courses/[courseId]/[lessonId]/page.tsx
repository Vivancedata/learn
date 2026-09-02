import type { Metadata } from 'next'
import LessonPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Lesson | Vivancedata',
  description: 'Study lesson content, complete activities, and join discussions.',
}

export default function LessonPage() {
  return <LessonPageClient />
}
