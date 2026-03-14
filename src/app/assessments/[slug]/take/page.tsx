import type { Metadata } from 'next'
import AssessmentTakePageClient from './page-client'

export const metadata: Metadata = {
  title: 'Take Assessment | Vivance',
  description: 'Complete your assessment and measure your skill level.',
}

export default function AssessmentTakePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <AssessmentTakePageClient params={params} />
}
