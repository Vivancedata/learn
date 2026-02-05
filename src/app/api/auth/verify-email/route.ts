import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  ValidationError,
} from '@/lib/api-errors'
import crypto from 'crypto'
import { generateToken, setAuthCookie } from '@/lib/auth'

const verifyEmailSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

/**
 * POST /api/auth/verify-email
 * Verify user's email address with verification code
 * @body userId + code - User ID and 6-digit code
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, verifyEmailSchema)

    if (body.code.length !== 6 || !/^\d{6}$/.test(body.code)) {
      throw new ValidationError('Invalid verification code')
    }

    const codeHash = crypto.createHash('sha256').update(body.code).digest('hex')

    const verificationRecord = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: body.userId,
        codeHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verificationRecord) {
      throw new ValidationError('Invalid or expired verification code')
    }

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: body.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { used: true },
      }),
    ])

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      emailVerified: true,
    })

    await setAuthCookie(token)

    return apiSuccess({
      message: 'Email verified successfully',
      verified: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
