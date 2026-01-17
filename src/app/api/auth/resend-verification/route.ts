import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
} from '@/lib/api-errors'
import crypto from 'crypto'

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * POST /api/auth/resend-verification
 * Resend email verification code
 * @body email - User's email address
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, resendVerificationSchema)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    // SECURITY: Always return success even if user doesn't exist
    if (!user) {
      return apiSuccess({
        message: 'If an account exists, a verification code has been sent.',
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      return apiSuccess({
        message: 'Email is already verified.',
      })
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // TODO: Store verification code in database with expiry
    // For now, just log it
    console.log('=================================')
    console.log('EMAIL VERIFICATION CODE')
    console.log('=================================')
    console.log('User:', user.email)
    console.log('Code:', verificationCode)
    console.log('Expires:', new Date(Date.now() + 15 * 60 * 1000).toISOString())
    console.log('=================================')

    // TODO: In production, send email with verification code
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Verify Your Email',
    //   html: `Your verification code is: ${verificationCode}`
    // })

    return apiSuccess({
      message: 'If an account exists, a verification code has been sent.',
      // Only include code in development
      ...(process.env.NODE_ENV !== 'production' && { verificationCode }),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
