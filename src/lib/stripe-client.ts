/**
 * Stripe Client-Side Configuration
 * Provides client-side Stripe.js instance for React components
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'

// ============================================================================
// Stripe Client Singleton
// ============================================================================

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Gets or initializes the Stripe client-side instance
 * Uses singleton pattern to avoid multiple Stripe.js loads
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}

// ============================================================================
// Price Configuration (Client-Side)
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Get started with the basics',
    price: 0,
    priceDisplay: '$0',
    interval: 'forever',
    features: [
      'Access to 3 free courses',
      'Basic lesson content',
      'Community discussions',
      'Course progress tracking',
      'Email support',
    ],
    limitations: [
      'Limited course access',
      'No skill assessments',
      'No certificates',
      'No priority support',
    ],
  },
  PRO_MONTHLY: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    description: 'Full access billed monthly',
    price: 19,
    priceDisplay: '$19',
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || '',
    features: [
      'Unlimited course access',
      'All learning paths',
      'Skill assessments',
      'Verified certificates',
      'Priority support',
      'Project feedback',
      'Offline access',
      'Early access to new content',
    ],
    popular: false,
  },
  PRO_YEARLY: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    description: 'Full access with 2 months free',
    price: 149,
    priceDisplay: '$149',
    interval: 'year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || '',
    savings: '38',
    features: [
      'Unlimited course access',
      'All learning paths',
      'Skill assessments',
      'Verified certificates',
      'Priority support',
      'Project feedback',
      'Offline access',
      'Early access to new content',
    ],
    popular: true,
  },
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS

// ============================================================================
// Checkout Helpers
// ============================================================================

/**
 * Redirects to Stripe Checkout for subscription
 * @param priceId - The Stripe price ID to checkout
 */
export async function redirectToCheckout(priceId: string): Promise<void> {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId }),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create checkout session')
  }

  const { data } = await response.json()

  if (data.url) {
    window.location.href = data.url
  } else {
    throw new Error('No checkout URL returned')
  }
}

/**
 * Redirects to Stripe Customer Portal for subscription management
 */
export async function redirectToPortal(): Promise<void> {
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create portal session')
  }

  const { data } = await response.json()

  if (data.url) {
    window.location.href = data.url
  } else {
    throw new Error('No portal URL returned')
  }
}
