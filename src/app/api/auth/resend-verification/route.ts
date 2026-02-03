import { NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
} from '@/lib/api-errors'
import {
  sendVerificationEmail,
  generateVerificationCode,
  isEmailServiceConfigured,
} from '@/lib/email'

// Support both email-based and userId-based resend
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

    // Find user by email or userId
    const user = await prisma.user.findUnique({
      where: 'email' in body ? { email: body.email } : { id: body.userId },
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

    // Generate new verification token and code
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    // Delete any existing unused tokens for this user
    try {
      await prisma.emailVerificationToken.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      })

      // Create new verification token
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          code: verificationCode,
          expiresAt,
        },
      })
    } catch (dbError) {
      // EmailVerificationToken model might not exist yet
      console.warn('[Resend Verification] Could not create token:', dbError)
    }

    // Send verification email
    const userName = user.name || user.email.split('@')[0]

    if (isEmailServiceConfigured()) {
      const emailResult = await sendVerificationEmail({
        to: user.email,
        userName,
        verificationCode,
        verificationToken,
      })

      if (!emailResult.success) {
        console.error('[Resend Verification] Failed to send email:', emailResult.error)
      }
    } else {
      // Development: Log verification info to console
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`

      console.log('=================================')
      console.log('EMAIL VERIFICATION (Dev Mode)')
      console.log('=================================')
      console.log('User:', user.email)
      console.log('Code:', verificationCode)
      console.log('Verification URL:', verificationUrl)
      console.log('Expires:', expiresAt.toISOString())
      console.log('=================================')
      console.log('Note: Set RESEND_API_KEY to send real emails')
      console.log('=================================')
    }

    // Build response
    const responseData: { message: string; verificationCode?: string } = {
      message: 'If an account exists, a verification code has been sent.',
    }

    // Only include code in development when email service is not configured
    if (process.env.NODE_ENV !== 'production' && !isEmailServiceConfigured()) {
      responseData.verificationCode = verificationCode
    }

    return apiSuccess(responseData)
  } catch (error) {
    return handleApiError(error)
  }
}
