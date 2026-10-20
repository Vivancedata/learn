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
    // Only what the app actually does for a free account today: course
    // access is not limited, and assessments and certificates are gated to
    // Pro by their API routes.
    features: [
      'Every course and learning path',
      'Lessons, quizzes and exercises',
      'Course progress tracking',
      'Community discussions',
    ],
    limitations: [
      'No skill assessments',
      'No course certificates',
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
    // Keep this list to features the code backs: assessments and
    // certificates are Pro-gated server-side, and Pro lifts the AI tutor's
    // daily message limit.
    features: [
      'Everything in Free',
      'Skill assessments',
      'Course certificates with a verification code',
      'Unlimited AI tutor messages',
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
    // Keep this list to features the code backs: assessments and
    // certificates are Pro-gated server-side, and Pro lifts the AI tutor's
    // daily message limit.
    features: [
      'Everything in Free',
      'Skill assessments',
      'Course certificates with a verification code',
      'Unlimited AI tutor messages',
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
