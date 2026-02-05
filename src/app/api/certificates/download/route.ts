import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  handleApiError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { createSimpleCertificatePdf } from '@/lib/pdf'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('certificateId')

    if (!certificateId) {
      throw new NotFoundError('Certificate')
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: { id: true, title: true, difficulty: true, durationHours: true },
        },
      },
    })

    if (!certificate) {
      throw new NotFoundError('Certificate')
    }

    if (certificate.userId !== user.userId) {
      throw new ForbiddenError('You can only download your own certificates')
    }

    const issuedDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const skills = JSON.parse(certificate.skills) as string[]
    const recipientName = certificate.user.name || certificate.user.email

    const pdf = createSimpleCertificatePdf({
      recipientName,
      courseTitle: certificate.course.title,
      issuedDate,
      verificationCode: certificate.verificationCode,
      skills,
    })

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.course.title
          .replace(/\s+/g, '-')
          .toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
