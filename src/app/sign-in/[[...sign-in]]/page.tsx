"use client"

import { SignIn } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function SignInPage() {
  if (isClerkConfigured) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <SignIn />
      </div>
    )
  }

  // Fallback UI when Clerk is not configured
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Authentication is not configured. Please set up Clerk to enable sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add your Clerk API keys to <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> to enable authentication.
            See <code className="bg-muted px-1 py-0.5 rounded">.env.example</code> for required variables.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
