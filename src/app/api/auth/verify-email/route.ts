import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
  ValidationError,
} from '@/lib/api-errors'

const verifyEmailSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().min(6).max(6),
})

/**
 * POST /api/auth/verify-email
 * Verify user's email address with verification code
 * @body userId - User ID
 * @body code - 6-digit verification code
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, verifyEmailSchema)

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Check if already verified
    if (user.emailVerified) {
      return apiSuccess({
        message: 'Email already verified',
        verified: true,
      })
    }

    // TODO: In production, verify the code matches what was sent
    // For now, accept any 6-digit code
    if (body.code.length !== 6 || !/^\d{6}$/.test(body.code)) {
      throw new ValidationError('Invalid verification code')
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: body.userId },
      data: { emailVerified: true },
    })

    console.log('=================================')
    console.log('EMAIL VERIFIED')
    console.log('=================================')
    console.log('User:', user.email)
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
