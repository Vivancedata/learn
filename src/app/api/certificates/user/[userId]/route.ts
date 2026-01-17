import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError, NotFoundError } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'

/**
 * GET /api/certificates/user/[userId]
 * Get all certificates for a user (user can only view their own certificates)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // SECURITY: User can only view their own certificates
    requireOwnership(request, userId, 'certificates')

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Get all certificates for this user
    const certificates = await prisma.certificate.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            durationHours: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    })

    // Parse skills JSON for each certificate
    const certificatesWithParsedSkills = certificates.map(cert => ({
      ...cert,
      skills: JSON.parse(cert.skills),
    }))

    return apiSuccess({
      certificates: certificatesWithParsedSkills,
      count: certificates.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
