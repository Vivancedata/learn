import type { Metadata } from 'next'
import LeaderboardPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Leaderboard | Vivance',
  description: 'Track top learners and your progress across the platform.',
}

export default function LeaderboardPage() {
  return <LeaderboardPageClient />
}
