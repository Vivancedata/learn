"use client"

// import { 
//   SignInButton, 
//   SignUpButton, 
//   UserButton as ClerkUserButton,
//   useUser
// } from "@clerk/nextjs"
import { Button } from "./button"
import Link from "next/link"

export function UserButton() {
  // Mock user state for development
  const isSignedIn = false

  if (isSignedIn) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/">
          <span>Sign Out</span>
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/sign-in">
          <span>Sign In</span>
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-up">
          <span>Sign Up</span>
        </Link>
      </Button>
    </div>
  )
}
