import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { updateUserSettingsSchema, validateBody } from '@/lib/validations'
import {
  apiSuccess,
  handleApiError,
  NotFoundError,
  ValidationError,
} from '@/lib/api-errors'

// GET - Get current user settings
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        githubUsername: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return apiSuccess(user)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const userId = session.userId

    const body = await request.json()
    const validation = validateBody(updateUserSettingsSchema, body)
    if (!validation.success) {
      throw new ValidationError(validation.error)
    }

    const { name, email, githubUsername } = validation.data

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      })
      if (existingUser) {
        throw new ValidationError('Email already in use')
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name || null }),
        ...(email && { email }),
        ...(githubUsername !== undefined && { githubUsername: githubUsername || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        githubUsername: true,
      },
    })

    return apiSuccess(updatedUser)
  } catch (error) {
    return handleApiError(error)
  }
}
