"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Only block on the very first resolution. A refresh of a user we already
  // have (e.g. after saving settings) must not unmount the page: that threw
  // away its state and any feedback set after the await.
  const resolving = loading && !user

  const redirectTo = resolving
    ? null
    : !user
      ? "sign-in"
      : user.emailVerified === false
        ? "verify-email"
        : null

  // Navigate from an effect, not during render.
  useEffect(() => {
    if (redirectTo === "sign-in") {
      const redirectPath = pathname
        ? `${pathname}${window.location.search}`
        : "/dashboard"
      router.replace(`/sign-in?redirect=${encodeURIComponent(redirectPath)}`)
    } else if (redirectTo === "verify-email" && user) {
      const params = new URLSearchParams({ userId: user.id, email: user.email })
      router.replace(`/verify-email?${params.toString()}`)
    }
  }, [redirectTo, pathname, router, user])

  if (resolving) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (redirectTo) {
    return null
  }

  return <>{children}</>
}
