import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
  UnauthorizedError,
} from '@/lib/api-errors'
import { signInSchema } from '@/lib/validations'
import {
  comparePassword,
  generateToken,
  setAuthCookie,
} from '@/lib/auth'

/**
 * POST /api/auth/signin
 * Authenticate a user and return a JWT token
 * @body email - User email
 * @body password - User password
 * @returns User data with JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await parseRequestBody(request, signInSchema)

    const { email, password } = body

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        githubUsername: true,
      },
    })

    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password')
    }

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
        message: 'Sign in successful',
      },
      HTTP_STATUS.OK
    )
  } catch (error) {
    return handleApiError(error)
  }
}
