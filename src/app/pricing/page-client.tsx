'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, X, Zap } from 'lucide-react'
import { SUBSCRIPTION_PLANS, redirectToCheckout } from '@/lib/stripe-client'

export default function PricingPageClient() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)

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
        window.location.href = '/sign-in?redirect=/pricing'
        return
      }

      alert('Failed to start checkout. Please try again.')
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
          data-testid="billing-toggle"
          onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billingInterval === 'year' ? 'bg-primary' : 'bg-muted'
          }`}
          type="button"
          aria-label={`Switch to ${billingInterval === 'year' ? 'monthly' : 'yearly'} billing`}
          aria-pressed={billingInterval === 'year'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={billingInterval === 'year' ? 'font-semibold' : 'text-muted-foreground'}>
          Yearly
        </span>
        {billingInterval === 'year' && (
          <Badge
            variant="default"
            className="bg-emerald-700 text-white"
            data-testid="yearly-savings"
          >
            Save ${SUBSCRIPTION_PLANS.PRO_YEARLY.savings}
          </Badge>
        )}
      </div>

      <div className="mx-auto mb-20 grid max-w-4xl gap-8 md:grid-cols-2">
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
              <span className="text-4xl font-bold" data-testid="pro-price">${currentPlan.price}</span>
              <span className="text-muted-foreground" data-testid="pro-interval">/{currentPlan.interval}</span>
              {billingInterval === 'year' && (
                <div className="mt-1 text-sm text-muted-foreground">
                  ${Math.round(SUBSCRIPTION_PLANS.PRO_YEARLY.price / 12)}/month billed annually
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
                  Processing...
                </span>
              ) : (
                'Start Free Trial'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="rounded-2xl bg-primary/5 p-12 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to Accelerate Your Career?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Build practical AI and data skills with structured paths and hands-on projects.
          Start your 7-day free trial today.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button size="lg" onClick={() => handleSubscribe('pro')} disabled={loading === 'pro'}>
            {loading === 'pro' ? 'Processing...' : 'Start Free Trial'}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required for free plan. Cancel Pro anytime.
        </p>
      </div>
    </>
  )
}
