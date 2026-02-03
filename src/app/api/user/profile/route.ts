import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  NotFoundError,
} from '@/lib/api-errors'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  githubUsername: z.string().min(1).max(255).optional(),
})

/**
 * GET /api/user/profile
 * Get current user's profile information
 * @returns User profile with statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Get user profile with related data
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        githubUsername: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            courses: true,
            certificates: true,
            projectSubmissions: true,
            discussions: true,
            achievements: true,
          },
        },
      },
    })

    if (!userProfile) {
      throw new NotFoundError('User')
    }

    return apiSuccess({
      user: userProfile,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile
 * @body name - Optional updated name
 * @body githubUsername - Optional updated GitHub username
 * @returns Updated user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)

    // Parse and validate request body
    const body = await parseRequestBody(request, updateProfileSchema)

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.githubUsername !== undefined && { githubUsername: body.githubUsername }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        githubUsername: true,
        role: true,
        emailVerified: true,
      },
    })

    return apiSuccess({
      user: updatedUser,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
