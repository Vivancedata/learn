import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import PricingPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Pricing | Vivance',
  description: 'Compare plans and choose the best learning path for your goals.',
}

export default async function PricingPage() {
  const user = await getCurrentUser()

  return <PricingPageClient initialIsAuthenticated={Boolean(user)} />
}
