import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  ApiError,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { sendEmail } from '@/lib/email'
import { passwordResetTemplate } from '@/lib/email-templates'
import crypto from 'crypto'
import { checkRateLimitAsync, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { getAppUrl } from '@/lib/app-url'

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

    const clientId = getClientIdentifier(request)
    const rateLimit = await checkRateLimitAsync(`forgot:${clientId}`, RATE_LIMITS.AUTH_EMAIL)
    if (!rateLimit.success) {
      throw new ApiError(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too many password reset requests. Please try again later.'
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (!user) {
      return apiSuccess({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    })

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    })

    const resetUrl = `${getAppUrl()}/reset-password?token=${resetToken}`
    const resetTemplate = passwordResetTemplate({ resetUrl })

    try {
      await sendEmail({
        to: user.email,
        subject: resetTemplate.subject,
        text: resetTemplate.text,
        html: resetTemplate.html,
      })
    } catch (_error) {
      // Intentionally swallow errors to avoid leaking account existence.
    }

    return apiSuccess({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
