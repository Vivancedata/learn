"use client"

import { Button } from "./button"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { LogOut, User } from "lucide-react"

/**
 * User button component for authentication actions.
 * Uses custom JWT authentication system.
 */
export function UserButton() {
  const { user, logout, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user.name || user.email}</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Sign Out</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/sign-in">Sign In</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-up">Sign Up</Link>
      </Button>
    </div>
  )
}
