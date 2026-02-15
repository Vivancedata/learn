/**
 * Stripe Server-Side Configuration
 * Provides secure server-side Stripe client for payment processing
 */

import Stripe from 'stripe'

/**
 * Stripe server-side client instance - lazy initialization
 * Uses the latest API version
 */
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const instance = getStripe()
    const value = instance[prop as keyof Stripe]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

// ============================================================================
// Price Configuration
// ============================================================================

export const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || '',
  YEARLY: process.env.STRIPE_PRICE_ID_YEARLY || '',
} as const

// ============================================================================
// Subscription Helpers
// ============================================================================

/**
 * Creates a Stripe checkout session for subscription
 * @param customerId - Stripe customer ID
 * @param priceId - Stripe price ID for the subscription
 * @param userId - Internal user ID for metadata
 * @param successUrl - URL to redirect after successful checkout
 * @param cancelUrl - URL to redirect if checkout is cancelled
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  // Create idempotency key for retry safety
  const idempotencyKey = `checkout_${userId}_${Date.now()}`

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      priceId,
      created_at: new Date().toISOString(),
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  }, {
    idempotencyKey,
  })

  return session
}

/**
 * Creates a Stripe billing portal session for subscription management
 * @param customerId - Stripe customer ID
 * @param returnUrl - URL to return to after portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Creates or retrieves a Stripe customer for a user
 * @param userId - Internal user ID
 * @param email - User's email address
 * @param name - User's name (optional)
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0]
    // Update metadata if userId is not already set
    if (!customer.metadata.userId) {
      return await stripe.customers.update(customer.id, {
        metadata: { userId },
      })
    }
    return customer
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
      created_at: new Date().toISOString(),
    },
  })

  return customer
}

/**
 * Retrieves a subscription by ID
 * @param subscriptionId - Stripe subscription ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

/**
 * Cancels a subscription at period end
 * @param subscriptionId - Stripe subscription ID
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

/**
 * Reactivates a cancelled subscription
 * @param subscriptionId - Stripe subscription ID
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// ============================================================================
// Webhook Helpers
// ============================================================================

/**
 * Verifies and constructs a Stripe webhook event
 * @param body - Raw request body as string
 * @param signature - Stripe signature header
 * @returns Verified Stripe event
 */
export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}

// ============================================================================
// Type Exports
// ============================================================================

export type { Stripe }
