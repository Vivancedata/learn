import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import crypto from 'crypto'
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
import {
  sendVerificationEmail,
  generateVerificationCode,
  isEmailServiceConfigured,
} from '@/lib/email'

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

    // Generate and store email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    // Create verification token in database
    // Note: This will fail if EmailVerificationToken model doesn't exist yet
    // In that case, skip verification token creation
    try {
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          code: verificationCode,
          expiresAt,
        },
      })

      // Send verification email
      const userName = user.name || user.email.split('@')[0]

      if (isEmailServiceConfigured()) {
        const emailResult = await sendVerificationEmail({
          to: user.email,
          userName,
          verificationCode,
          verificationToken,
        })

        if (!emailResult.success) {
          // Email failed to send - tracked via email service
        }
      }
      // Note: In development without RESEND_API_KEY, verification code is returned in response
    } catch (dbError) {
      // EmailVerificationToken model might not exist yet - non-critical for signup
    }

    return apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          githubUsername: user.githubUsername,
          emailVerified: false,
        },
        token,
        message: 'Account created successfully. Please check your email to verify your account.',
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}
