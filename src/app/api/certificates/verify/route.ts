import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError, parseRequestBody, NotFoundError } from '@/lib/api-errors'

const verifyCertificateSchema = z.object({
  verificationCode: z.string().min(1),
})

/**
 * POST /api/certificates/verify
 * Verify a certificate by its verification code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, verifyCertificateSchema)

    const certificate = await prisma.certificate.findUnique({
      where: {
        verificationCode: body.verificationCode.toUpperCase(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            durationHours: true,
          },
        },
      },
    })

    if (!certificate) {
      throw new NotFoundError('Certificate')
    }

    // Check if certificate is expired
    const isExpired = certificate.expiryDate ? new Date() > certificate.expiryDate : false

    return apiSuccess({
      certificate: {
        ...certificate,
        skills: JSON.parse(certificate.skills),
      },
      isValid: !isExpired,
      isExpired,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
