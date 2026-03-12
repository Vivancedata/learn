import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import SignInPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Sign In | Vivance',
  description: 'Sign in to track your learning progress and continue where you left off.',
}

function getSafeRedirectPath(rawPath: string | string[] | undefined): string {
  const value = Array.isArray(rawPath) ? rawPath[0] : rawPath

  if (!value) return '/dashboard'
  if (!value.startsWith('/')) return '/dashboard'
  if (value.startsWith('//')) return '/dashboard'
  return value
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getCurrentUser()
  const resolvedSearchParams = await searchParams
  const redirectPath = getSafeRedirectPath(resolvedSearchParams?.redirect)

  if (user) {
    redirect(redirectPath)
  }

  return <SignInPageClient />
}
