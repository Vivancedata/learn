import type { Metadata } from 'next'
import ResetPasswordPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Reset Password | Vivancedata',
  description: 'Set a new password for your Vivancedata account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />
}
