import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
} from '@/lib/api-errors'
import { getAuthenticatedUserId } from '@/lib/authorization'
import prisma from '@/lib/db'

/**
 * Subscription status response type
 */
export interface SubscriptionStatusResponse {
  isSubscribed: boolean
  isPro: boolean
  subscription: {
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    trialEnd: string | null
  } | null
  plan: 'free' | 'pro'
}

/**
 * GET /api/subscription/status
 * Returns the current user's subscription status
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Get user's subscription from database
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    // Determine subscription status
    const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
    const isPastDue = subscription?.status === 'past_due'

    // User is considered Pro if they have an active subscription
    // or if they're past due but within grace period
    const isPro = isActive || isPastDue

    const response: SubscriptionStatusResponse = {
      isSubscribed: !!subscription?.stripeSubscriptionId,
      isPro,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialEnd: subscription.trialEnd?.toISOString() || null,
          }
        : null,
      plan: isPro ? 'pro' : 'free',
    }

    return apiSuccess(response)
  } catch (error) {
    return handleApiError(error)
  }
}
