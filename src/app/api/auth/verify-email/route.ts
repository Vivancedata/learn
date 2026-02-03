import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  ValidationError,
} from '@/lib/api-errors'

// Schema for token-based verification (link clicked)
const verifyByTokenSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
})

// Schema for code-based verification (code entered manually)
const verifyByCodeSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

// Combined schema that accepts either token OR userId+code
const verifyEmailSchema = z.union([
  verifyByTokenSchema,
  verifyByCodeSchema,
])

/**
 * POST /api/auth/verify-email
 * Verify user's email address with verification token or code
 * @body token - Verification token from email link (option 1)
 * @body userId + code - User ID and 6-digit code (option 2)
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, verifyEmailSchema)

    let verificationRecord

    // Check if verifying by token or by code
    if ('token' in body) {
      // Token-based verification (clicked link in email)
      verificationRecord = await prisma.emailVerificationToken.findUnique({
        where: { token: body.token },
        include: { user: true },
      })

      if (!verificationRecord) {
        throw new ValidationError('Invalid or expired verification link')
      }
    } else {
      // Code-based verification (entered code manually)
      verificationRecord = await prisma.emailVerificationToken.findFirst({
        where: {
          userId: body.userId,
          code: body.code,
          used: false,
        },
        include: { user: true },
      })

      if (!verificationRecord) {
        throw new ValidationError('Invalid verification code')
      }
    }

    // Validate token hasn't been used
    if (verificationRecord.used) {
      // Check if email is already verified
      if (verificationRecord.user.emailVerified) {
        return apiSuccess({
          message: 'Email already verified',
          verified: true,
        })
      }
      throw new ValidationError('This verification link has already been used')
    }

    // Validate token hasn't expired
    if (new Date() > verificationRecord.expiresAt) {
      throw new ValidationError('This verification link has expired. Please request a new one.')
    }

    // Mark email as verified and token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { used: true },
      }),
    ])

    console.log('=================================')
    console.log('EMAIL VERIFIED')
    console.log('=================================')
    console.log('User:', verificationRecord.user.email)
    console.log('Time:', new Date().toISOString())
    console.log('=================================')

    return apiSuccess({
      message: 'Email verified successfully',
      verified: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
