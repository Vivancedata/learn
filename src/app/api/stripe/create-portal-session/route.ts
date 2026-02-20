import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  HTTP_STATUS,
  ApiError,
} from '@/lib/api-errors'
import { getAuthenticatedUserId } from '@/lib/authorization'
import { createPortalSession } from '@/lib/stripe'
import prisma from '@/lib/db'
import { getAppUrl } from '@/lib/app-url'

/**
 * POST /api/stripe/create-portal-session
 * Creates a Stripe billing portal session for subscription management
 * @returns Portal session URL
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Get user's subscription from database
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription?.stripeCustomerId) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No subscription found for user')
    }

    // Create portal session
    const appUrl = getAppUrl()
    const returnUrl = `${appUrl}/settings`

    const session = await createPortalSession(subscription.stripeCustomerId, returnUrl)

    return apiSuccess({ url: session.url }, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}
