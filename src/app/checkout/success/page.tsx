import type { Metadata } from 'next'
import { Suspense } from 'react'
import CheckoutSuccessPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Checkout Success | Vivance',
  description: 'Your subscription is active and your Pro features are ready.',
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <CheckoutSuccessPageClient />
    </Suspense>
  )
}
