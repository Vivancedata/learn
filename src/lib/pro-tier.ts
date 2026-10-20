/**
 * The paid Pro tier is off until the owner turns it on.
 *
 * Set NEXT_PUBLIC_PRO_TIER_ENABLED="true" to sell Pro again. While it is
 * unset (the default) the pricing page shows only the Free plan, upgrade
 * prompts are hidden, and POST /api/stripe/create-checkout-session refuses.
 * The Stripe webhook and billing-portal routes keep working so anyone who
 * already subscribed can still manage or cancel their subscription.
 *
 * NEXT_PUBLIC_ variables are inlined into the client bundle at build time,
 * so changing it needs a redeploy.
 */
export function isProTierEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRO_TIER_ENABLED === 'true'
}
