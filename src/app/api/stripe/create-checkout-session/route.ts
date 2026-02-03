import { NextRequest } from 'next/server'
import {
  apiSuccess,
  handleApiError,
  parseRequestBody,
  HTTP_STATUS,
} from '@/lib/api-errors'
import { createCheckoutSessionSchema } from '@/lib/validations'
import { getAuthenticatedUserId } from '@/lib/authorization'
import {
  stripe,
  createCheckoutSession,
  getOrCreateCustomer,
  STRIPE_PRICES,
} from '@/lib/stripe'
import prisma from '@/lib/db'

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe checkout session for subscription
 * @body priceId - The Stripe price ID to subscribe to
 * @returns Checkout session URL
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = getAuthenticatedUserId(request)

    // Parse and validate request body
    const body = await parseRequestBody(request, createCheckoutSessionSchema)
    const { priceId } = body

    // Validate price ID
    const validPriceIds = [STRIPE_PRICES.MONTHLY, STRIPE_PRICES.YEARLY]
    if (!validPriceIds.includes(priceId)) {
      return handleApiError(new Error('Invalid price ID'))
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      return handleApiError(new Error('User not found'))
    }

    // Check if user already has an active subscription
    if (user.subscription?.status === 'active') {
      return handleApiError(new Error('User already has an active subscription'))
    }

    // Get or create Stripe customer
    let stripeCustomerId: string

    if (user.subscription?.stripeCustomerId) {
      stripeCustomerId = user.subscription.stripeCustomerId
    } else {
      const customer = await getOrCreateCustomer(userId, user.email, user.name || undefined)
      stripeCustomerId = customer.id

      // Store the customer ID
      await prisma.subscription.upsert({
        where: { userId },
        update: { stripeCustomerId },
        create: {
          userId,
          stripeCustomerId,
          status: 'incomplete',
        },
      })
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      userId,
      `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      `${appUrl}/checkout/cancel`
    )

    return apiSuccess({ url: session.url }, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleApiError(error)
  }
}
