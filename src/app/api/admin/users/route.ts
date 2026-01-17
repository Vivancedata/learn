import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  ForbiddenError,
} from '@/lib/api-errors'
import { requireRole } from '@/lib/auth'

/**
 * GET /api/admin/users
 * Get all users with pagination
 * SECURITY: Only admins can access
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole(request, ['admin'])

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          githubUsername: true,
          _count: {
            select: {
              courses: true,
              certificates: true,
              projectSubmissions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ])

    return apiSuccess({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['student', 'instructor', 'admin']),
})

/**
 * PATCH /api/admin/users
 * Update user role
 * SECURITY: Only admins can change roles
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require admin role
    const admin = await requireRole(request, ['admin'])

    const body = await parseRequestBody(request, updateUserRoleSchema)

    // Prevent admin from demoting themselves
    if (body.userId === admin.userId && body.role !== 'admin') {
      throw new ForbiddenError('You cannot change your own role')
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: body.userId },
      data: { role: body.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    console.log('=================================')
    console.log('USER ROLE UPDATED')
    console.log('=================================')
    console.log('User:', updatedUser.email)
    console.log('New Role:', updatedUser.role)
    console.log('Updated By:', admin.email)
    console.log('=================================')

    return apiSuccess({
      user: updatedUser,
      message: `User role updated to ${body.role}`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
