import type { Metadata } from 'next'
import ResetPasswordPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Reset Password | Vivance',
  description: 'Set a new password for your Vivance account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />
}
