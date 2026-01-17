import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'

/**
 * GET /api/admin/stats
 * Get platform statistics for admin dashboard
 * SECURITY: Only instructors and admins can access
 */
export async function GET(request: NextRequest) {
  try {
    // Require instructor or admin role
    await requireRole(request, ['instructor', 'admin'])

    // Gather statistics in parallel
    const [
      totalUsers,
      verifiedUsers,
      totalCourses,
      totalLessons,
      pendingProjects,
      approvedProjects,
      totalCertificates,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.projectSubmission.count({ where: { status: 'pending' } }),
      prisma.projectSubmission.count({ where: { status: 'approved' } }),
      prisma.certificate.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          role: true,
        },
      }),
    ])

    // Role breakdown
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    return apiSuccess({
      overview: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
      },
      content: {
        totalCourses,
        totalLessons,
        avgLessonsPerCourse: totalCourses > 0 ? Math.round(totalLessons / totalCourses) : 0,
      },
      projects: {
        pending: pendingProjects,
        approved: approvedProjects,
        total: pendingProjects + approvedProjects,
      },
      certificates: {
        issued: totalCertificates,
      },
      roles: roleStats.reduce((acc, stat) => {
        acc[stat.role] = stat._count
        return acc
      }, {} as Record<string, number>),
      recentUsers,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
