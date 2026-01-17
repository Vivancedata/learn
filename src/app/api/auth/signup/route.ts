import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
  ApiError,
} from '@/lib/api-errors'
import { signUpSchema } from '@/lib/validations'
import {
  hashPassword,
  generateToken,
  setAuthCookie,
} from '@/lib/auth'

/**
 * POST /api/auth/signup
 * Create a new user account
 * @body email - User email
 * @body password - User password
 * @body name - User name (optional)
 * @body githubUsername - GitHub username (optional)
 * @returns User data with JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, signUpSchema)

    const { email, password, name, githubUsername } = body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'An account with this email already exists'
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        githubUsername: githubUsername || null,
        role: 'student', // Default role
      },
      select: {
        id: true,
        email: true,
        name: true,
        githubUsername: true,
        role: true,
      },
    })

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
    })

    // Set authentication cookie
    await setAuthCookie(token)

    return apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          githubUsername: user.githubUsername,
        },
        token,
        message: 'Account created successfully',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}
