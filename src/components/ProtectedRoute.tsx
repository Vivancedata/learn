"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    const currentQuery = typeof window !== 'undefined'
      ? window.location.search
      : ''
    const redirectPath = pathname
      ? `${pathname}${currentQuery}`
      : '/dashboard'
    const redirectParam = encodeURIComponent(redirectPath)
    if (typeof window !== 'undefined') {
      void router.replace(`/sign-in?redirect=${redirectParam}`)
    }
    return null
  }

  if (user.emailVerified === false) {
    const params = new URLSearchParams({
      userId: user.id,
      email: user.email,
    })
    if (typeof window !== 'undefined') {
      void router.replace(`/verify-email?${params.toString()}`)
    }
    return null
  }

  return <>{children}</>
}
