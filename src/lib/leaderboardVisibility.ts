/**
 * Which users may appear on public leaderboards.
 *
 * Besides the user's own opt-out (showOnLeaderboard), this excludes the
 * database seed accounts ("Admin User" / "Regular User"), which shipped to
 * production and sat on the public podium. Seeded accounts are created with
 * RFC 2606-reserved example.com addresses, which no real signup can have.
 */
export const PUBLIC_LEADERBOARD_USER_WHERE = {
  showOnLeaderboard: true,
  NOT: { email: { endsWith: '@example.com' } },
} as const

export function isPubliclyRankable(user: {
  showOnLeaderboard: boolean
  email: string
}): boolean {
  return user.showOnLeaderboard && !user.email.endsWith('@example.com')
}
