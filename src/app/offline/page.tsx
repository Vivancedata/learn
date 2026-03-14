import type { Metadata } from 'next'
import OfflinePageClient from './page-client'

export const metadata: Metadata = {
  title: 'Offline | Vivance',
  description: 'You are offline. Reconnect to continue learning.',
}

export default function OfflinePage() {
  return <OfflinePageClient />
}
