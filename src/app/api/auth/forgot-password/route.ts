import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  HTTP_STATUS,
} from '@/lib/api-errors'
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

    // TODO: Send email with reset link
    // For now, log the reset token (in production, this would be emailed)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    console.log('=================================')
    console.log('PASSWORD RESET REQUEST')
    console.log('=================================')
    console.log('User:', user.email)
    console.log('Reset URL:', resetUrl)
    console.log('Token:', resetToken)
    console.log('Expires:', expiresAt.toISOString())
    console.log('=================================')

    // TODO: In production, integrate with email service:
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Password Reset Request',
    //   html: `Click here to reset your password: ${resetUrl}`
    // })

    return apiSuccess({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Only include resetUrl in development
      ...(process.env.NODE_ENV !== 'production' && { resetUrl }),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
