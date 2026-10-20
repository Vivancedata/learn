'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, X, Zap } from 'lucide-react'
import { SUBSCRIPTION_PLANS, redirectToCheckout } from '@/lib/stripe-client'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function FreePlanCard() {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <CardTitle as="h2">{SUBSCRIPTION_PLANS.FREE.name}</CardTitle>
        </div>
        <CardDescription>{SUBSCRIPTION_PLANS.FREE.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <span className="text-4xl font-bold">{SUBSCRIPTION_PLANS.FREE.priceDisplay}</span>
          <span className="text-muted-foreground">/{SUBSCRIPTION_PLANS.FREE.interval}</span>
        </div>

        <ul className="mb-6 space-y-3">
          {SUBSCRIPTION_PLANS.FREE.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <span>{feature}</span>
            </li>
          ))}
          {SUBSCRIPTION_PLANS.FREE.limitations.map((limitation) => (
            <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
              <X className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/sign-up">Get Started Free</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Shown instead of the Pro plan while the paid tier is switched off
 * (src/lib/pro-tier.ts). No price, no button, no feature promises.
 */
function ProComingSoonCard() {
  return (
    <Card className="relative" data-testid="pro-coming-soon">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Crown className="h-5 w-5 text-muted-foreground" />
          <CardTitle as="h2">Pro</CardTitle>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
        <CardDescription>Not on sale yet</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          A paid plan is in the works. Until it launches there is nothing to
          pay for here. Skill assessments and course certificates will be
          part of Pro.
        </p>
      </CardContent>
    </Card>
  )
}

export default function PricingPageClient({ proEnabled }: { proEnabled: boolean }) {
  const router = useRouter()
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year')
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  if (!proEnabled) {
    return (
      <>
        <div className="mx-auto mb-20 grid max-w-4xl gap-8 md:grid-cols-2">
          <FreePlanCard />
          <ProComingSoonCard />
        </div>

        <div className="rounded-2xl bg-primary/5 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Start Learning</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Build practical AI and data skills with structured paths and hands-on projects.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">Create a Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    setCheckoutError(null)

    try {
      const priceId = billingInterval === 'year'
        ? SUBSCRIPTION_PLANS.PRO_YEARLY.priceId
        : SUBSCRIPTION_PLANS.PRO_MONTHLY.priceId

      await redirectToCheckout(priceId)
    } catch (error) {
      if (
        error instanceof Error &&
        /unauthorized|authentication|required|sign in/i.test(error.message)
      ) {
        router.push(`/sign-in?redirect=${encodeURIComponent('/pricing')}`)
        return
      }

      setCheckoutError('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const currentPlan =
    billingInterval === 'year' ? SUBSCRIPTION_PLANS.PRO_YEARLY : SUBSCRIPTION_PLANS.PRO_MONTHLY

  return (
    <>
      <div className="mb-12 flex items-center justify-center gap-4">
        <span className={billingInterval === 'month' ? 'font-semibold' : 'text-muted-foreground'}>
          Monthly
        </span>
        <button
          id="billing-toggle"
          data-testid="billing-toggle"
          onClick={() => setBillingInterval((prev) => (prev === 'month' ? 'year' : 'month'))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billingInterval === 'year' ? 'bg-primary' : 'bg-muted'
          }`}
          type="button"
          role="switch"
          aria-label="Yearly billing"
          aria-checked={billingInterval === 'year'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <label
          htmlFor="billing-toggle"
          className={`cursor-pointer ${billingInterval === 'year' ? 'font-semibold' : 'text-muted-foreground'}`}
        >
          Yearly
        </label>
        {billingInterval === 'year' && (
          <Badge
            variant="default"
            className="bg-emerald-700 text-white"
            data-testid="yearly-savings"
          >
            Save {usd.format(Number(SUBSCRIPTION_PLANS.PRO_YEARLY.savings))}
          </Badge>
        )}
      </div>

      <div className="mx-auto mb-20 grid max-w-4xl gap-8 md:grid-cols-2">
        <FreePlanCard />

        <Card className="relative border-brand shadow-lg">
          {currentPlan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Crown className="h-5 w-5 text-brand" />
              <CardTitle as="h2">Pro</CardTitle>
            </div>
            <CardDescription>{currentPlan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold" data-testid="pro-price">{usd.format(currentPlan.price)}</span>
              <span className="text-muted-foreground" data-testid="pro-interval">/{currentPlan.interval}</span>
              {billingInterval === 'year' && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {usd.format(Math.round(SUBSCRIPTION_PLANS.PRO_YEARLY.price / 12))}/month billed annually
                </div>
              )}
            </div>

            <ul className="mb-6 space-y-3">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleSubscribe('pro')}
              disabled={loading === 'pro'}
            >
              {loading === 'pro' ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing…
                </span>
              ) : (
                'Subscribe to Pro'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {checkoutError && (
        <p role="alert" className="-mt-12 mb-8 text-center text-sm text-destructive">
          {checkoutError}
        </p>
      )}

      <div className="rounded-2xl bg-primary/5 p-12 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to Accelerate Your Career?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Build practical AI and data skills with structured paths and hands-on projects.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button size="lg" onClick={() => handleSubscribe('pro')} disabled={loading === 'pro'}>
            {loading === 'pro' ? 'Processing…' : 'Subscribe to Pro'}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required for the free plan. Cancel Pro anytime.
        </p>
      </div>
    </>
  )
}
