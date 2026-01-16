"use client"

import {
  SignInButton,
  SignUpButton,
  UserButton as ClerkUserButton,
  SignedIn,
  SignedOut
} from "@clerk/nextjs"
import { Button } from "./button"
import Link from "next/link"

// Check if Clerk is configured (client-side check)
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function UserButton() {
  // If Clerk is not configured, show simple sign in/up links
  if (!isClerkConfigured) {
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

  return (
    <>
      <SignedIn>
        <ClerkUserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </SignedOut>
    </>
  )
}
