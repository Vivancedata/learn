import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  ValidationError,
} from '@/lib/api-errors'
import { hashPassword } from '@/lib/auth'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

/**
 * POST /api/auth/reset-password
 * Reset user's password using a valid reset token
 * @body token - Password reset token
 * @body newPassword - New password
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, resetPasswordSchema)

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
      include: { user: true },
    })

    // Validate token exists
    if (!resetToken) {
      throw new ValidationError('Invalid or expired reset token')
    }

    // Validate token hasn't been used
    if (resetToken.used) {
      throw new ValidationError('This reset token has already been used')
    }

    // Validate token hasn't expired
    if (new Date() > resetToken.expiresAt) {
      throw new ValidationError('This reset token has expired. Please request a new one.')
    }

    // Hash new password
    const hashedPassword = await hashPassword(body.newPassword)

    // Update user's password and mark token as used
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    return apiSuccess({
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
