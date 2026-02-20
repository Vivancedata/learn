import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError, parseRequestBody, NotFoundError, ValidationError, ForbiddenError, HTTP_STATUS } from '@/lib/api-errors'
import { requireOwnership } from '@/lib/authorization'
import crypto from 'crypto'

const generateCertificateSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().min(1),
})

function hasProAccess(subscriptionStatus: string | null | undefined): boolean {
  return (
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing' ||
    subscriptionStatus === 'past_due'
  )
}

/**
 * POST /api/certificates/generate
 * Generate a certificate for a user who completed a course
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, generateCertificateSchema)

    // Authorization check - user can only generate certificate for themselves
    requireOwnership(request, body.userId, 'certificate generation')

    const subscription = await prisma.subscription.findUnique({
      where: { userId: body.userId },
      select: { status: true },
    })

    if (!hasProAccess(subscription?.status)) {
      throw new ForbiddenError('Verified certificates require a Pro subscription')
    }

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // 2. Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      include: {
        sections: {
          include: {
            lessons: {
              include: {
                quizQuestions: true,
              },
            },
          },
        },
      },
    })

    if (!course) {
      throw new NotFoundError('Course')
    }

    // 3. Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId: body.userId,
        courseId: body.courseId,
      },
    })

    if (existingCertificate) {
      return apiSuccess({
        certificate: existingCertificate,
        message: 'Certificate already exists for this course',
      })
    }

    // 4. Get user's course progress
    const courseProgress = await prisma.courseProgress.findFirst({
      where: {
        userId: body.userId,
        courseId: body.courseId,
      },
      include: {
        completedLessons: true,
        quizScores: true,
      },
    })

    if (!courseProgress) {
      throw new ValidationError(
        'Cannot generate certificate - course not started',
        { reason: 'No progress found for this course' }
      )
    }

    // 5. Calculate total lessons and completed lessons
    const allLessons = course.sections.flatMap(section => section.lessons)
    const totalLessons = allLessons.length
    const completedLessonIds = new Set(courseProgress.completedLessons.map(l => l.id))
    const completedCount = allLessons.filter(lesson => completedLessonIds.has(lesson.id)).length

    // 6. Check if all lessons are completed
    if (completedCount < totalLessons) {
      throw new ValidationError(
        'Cannot generate certificate - course not completed',
        {
          totalLessons,
          completedLessons: completedCount,
          remainingLessons: totalLessons - completedCount,
        }
      )
    }

    // 7. Calculate quiz completion (if there are quizzes)
    const lessonsWithQuiz = allLessons.filter(lesson => lesson.quizQuestions.length > 0)
    if (lessonsWithQuiz.length > 0) {
      const completedQuizIds = new Set(courseProgress.quizScores.map(q => q.lessonId))
      const passedQuizzes = lessonsWithQuiz.filter(lesson => completedQuizIds.has(lesson.id))

      if (passedQuizzes.length < lessonsWithQuiz.length) {
        throw new ValidationError(
          'Cannot generate certificate - all quizzes must be completed',
          {
            totalQuizzes: lessonsWithQuiz.length,
            completedQuizzes: passedQuizzes.length,
            remainingQuizzes: lessonsWithQuiz.length - passedQuizzes.length,
          }
        )
      }
    }

    // 8. Extract skills from course (from learningOutcomes)
    let skills: string[] = []
    if (course.learningOutcomes) {
      try {
        const outcomes = JSON.parse(course.learningOutcomes)
        if (Array.isArray(outcomes)) {
          skills = outcomes
        }
      } catch {
        // If parsing fails, use default skills based on course title
        skills = [course.title]
      }
    } else {
      skills = [course.title]
    }

    // 9. Generate unique verification code
    const verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase()

    // 10. Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId: body.userId,
        courseId: body.courseId,
        verificationCode,
        skills: JSON.stringify(skills),
        issueDate: new Date(),
        // Certificates don't expire by default, but could add logic here
        expiryDate: null,
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

    return apiSuccess(
      {
        certificate: {
          ...certificate,
          skills: JSON.parse(certificate.skills),
        },
        message: 'Certificate generated successfully',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}
