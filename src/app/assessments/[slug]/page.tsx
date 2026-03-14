import type { Metadata } from 'next'
import AssessmentDetailPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Assessment Details | Vivance',
  description: 'Review assessment goals, history, and prepare to start.',
}

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <AssessmentDetailPageClient params={params} />
}
