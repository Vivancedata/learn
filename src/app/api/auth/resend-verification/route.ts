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
import { createEmailVerificationToken } from '@/lib/email-verification'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email'
import { verificationEmailTemplate } from '@/lib/email-templates'
import { checkRateLimitAsync, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

const resendVerificationSchema = z.union([
  z.object({
    email: z.string().email('Invalid email address'),
  }),
  z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
])

/**
 * POST /api/auth/resend-verification
 * Resend email verification code
 * @body email - User's email address (option 1)
 * @body userId - User's ID (option 2)
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, resendVerificationSchema)

    const clientId = getClientIdentifier(request)
    const rateLimit = await checkRateLimitAsync(`resend:${clientId}`, RATE_LIMITS.AUTH_EMAIL)
    if (!rateLimit.success) {
      throw new ApiError(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too many verification requests. Please try again later.'
      )
    }

    const user = await prisma.user.findUnique({
      where: 'email' in body ? { email: body.email } : { id: body.userId },
    })

    if (!user) {
      return apiSuccess({
        message: 'If an account exists, a verification code has been sent.',
      })
    }

    if (user.emailVerified) {
      return apiSuccess({
        message: 'Email is already verified.',
      })
    }

    const latestToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (latestToken) {
      const secondsSinceLast = Math.floor((Date.now() - latestToken.createdAt.getTime()) / 1000)
      const cooldownSeconds = 60
      if (secondsSinceLast < cooldownSeconds) {
        throw new ApiError(
          HTTP_STATUS.TOO_MANY_REQUESTS,
          `Please wait ${cooldownSeconds - secondsSinceLast}s before requesting another code.`
        )
      }
    }

    const { verificationCode, expiresAt } = await createEmailVerificationToken(user.id)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${appUrl}/verify-email?userId=${user.id}&email=${encodeURIComponent(
      user.email
    )}`

    const verificationTemplate = verificationEmailTemplate({
      code: verificationCode,
      verificationUrl,
    })

    try {
      await sendEmail({
        to: user.email,
        subject: verificationTemplate.subject,
        text: verificationTemplate.text,
        html: verificationTemplate.html,
      })
    } catch (_error) {
      // Intentionally swallow errors to avoid leaking account existence.
    }

    const shouldExpose = process.env.NODE_ENV !== 'production' || !isEmailServiceConfigured()

    return apiSuccess({
      message: 'If an account exists, a verification code has been sent.',
      ...(shouldExpose ? { verificationCode, expiresAt } : {}),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
