import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import bcrypt from 'bcrypt'

// Check if Clerk is configured
export const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/**
 * Get the current user ID from Clerk or return demo user ID
 */
export async function getUserId(): Promise<string | null> {
  if (isClerkConfigured) {
    const { userId } = await auth()
    return userId
  }
  // Demo mode - return fixed demo user ID
  return 'demo-user'
}

/**
 * Ensure demo user exists in the database (for development without Clerk)
 */
export async function ensureDemoUser(): Promise<void> {
  if (isClerkConfigured) return

  const demoUser = await prisma.user.findUnique({
    where: { id: 'demo-user' },
  })

  if (!demoUser) {
    // Hash the demo password properly
    const hashedPassword = await bcrypt.hash('demo-password-change-me', 10)

    await prisma.user.create({
      data: {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        password: hashedPassword,
      },
    })
  }
}

/**
 * Require authentication - returns userId or throws
 */
export async function requireAuth(): Promise<string> {
  const userId = await getUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  if (!isClerkConfigured) {
    await ensureDemoUser()
  }

  return userId
}
