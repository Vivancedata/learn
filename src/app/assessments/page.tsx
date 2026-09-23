import type { Metadata } from 'next'
import AssessmentsCatalogPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Skill Assessments | Vivancedata',
  description: 'Take assessments to measure your skills and track growth over time.',
}

export default function AssessmentsCatalogPage() {
  return <AssessmentsCatalogPageClient />
}
