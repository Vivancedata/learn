import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
} from '@/lib/api-errors'
import { sendPasswordResetEmail, isEmailServiceConfigured } from '@/lib/email'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * POST /api/auth/forgot-password
 * Generate a password reset token and send it to user's email
 * @body email - User's email address
 * @returns Success message (always returns success even if email doesn't exist for security)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, forgotPasswordSchema)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    // SECURITY: Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return apiSuccess({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Token expires in 1 hour
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    })

    // Send password reset email
    const userName = user.name || user.email.split('@')[0]

    if (isEmailServiceConfigured()) {
      // Production: Send actual email via Resend
      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        userName,
        resetToken,
        expiresInHours: 1,
      })

      if (!emailResult.success) {
        // Email failed to send - tracked via email service
        // Still return success to prevent email enumeration
        // The token is created, user can request again if needed
      }
    }
    // Note: In development without RESEND_API_KEY, resetUrl is returned in response

    // Build response - include resetUrl only in development when email service is not configured
    const responseData: { message: string; resetUrl?: string } = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    }

    if (process.env.NODE_ENV !== 'production' && !isEmailServiceConfigured()) {
      responseData.resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    }

    return apiSuccess(responseData)
  } catch (error) {
    return handleApiError(error)
  }
}
