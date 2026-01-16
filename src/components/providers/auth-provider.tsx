"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Check if Clerk is configured
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  // If Clerk is not configured, render children without auth wrapper
  if (!clerkPubKey) {
    return <>{children}</>
  }

  return <ClerkProvider>{children}</ClerkProvider>
}
