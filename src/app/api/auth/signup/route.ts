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
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { createEmailVerificationToken } from '@/lib/email-verification'
import { sendEmail, isEmailServiceConfigured } from '@/lib/email'
import { verificationEmailTemplate } from '@/lib/email-templates'
import { getAppUrl } from '@/lib/app-url'

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
    const body = await parseRequestBody(request, signUpSchema)
    const { email, password, name, githubUsername } = body

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'An account with this email already exists'
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        githubUsername: githubUsername || null,
        role: 'student',
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

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
      emailVerified: user.emailVerified,
    })

    await setAuthCookie(token)

    const { verificationCode, expiresAt } = await createEmailVerificationToken(user.id)
    const appUrl = getAppUrl()
    const verificationUrl = `${appUrl}/verify-email?userId=${user.id}&email=${encodeURIComponent(
      user.email
    )}`

    const verificationTemplate = verificationEmailTemplate({
      code: verificationCode,
      verificationUrl,
    })

    await sendEmail({
      to: user.email,
      subject: verificationTemplate.subject,
      text: verificationTemplate.text,
      html: verificationTemplate.html,
    })

    const shouldExposeCode =
      process.env.NODE_ENV !== 'production' || !isEmailServiceConfigured()

    return apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          githubUsername: user.githubUsername,
          emailVerified: user.emailVerified,
        },
        token,
        message: 'Account created successfully. Please verify your email.',
        ...(shouldExposeCode ? { verificationCode, expiresAt } : {}),
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleApiError(error)
  }
}
