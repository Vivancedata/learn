import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { apiSuccess, handleApiError } from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'

/**
 * GET /api/admin/projects/pending
 * Get all pending project submissions for review
 * SECURITY: Only instructors and admins can access
 * @returns List of pending project submissions
 */
export async function GET(request: NextRequest) {
  try {
    // Require instructor or admin role
    await requireRole(request, ['instructor', 'admin'])

    // Get all pending project submissions
    const pendingProjects = await prisma.projectSubmission.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'asc', // Oldest first (FIFO)
      },
    })

    // Format the response
    const formattedProjects = pendingProjects.map((project) => ({
      id: project.id,
      submittedAt: project.submittedAt,
      user: project.user,
      githubUrl: project.githubUrl,
      liveUrl: project.liveUrl,
      notes: project.notes,
      lesson: {
        id: project.lesson.id,
        title: project.lesson.title,
      },
      course: {
        id: project.lesson.section.course.id,
        title: project.lesson.section.course.title,
      },
    }))

    return apiSuccess({
      projects: formattedProjects,
      count: formattedProjects.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
