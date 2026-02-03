'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Zap, Crown, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe-client'
import { redirectToCheckout } from '@/lib/stripe-client'

// FAQ data
const faqs = [
  {
    question: 'Can I switch between monthly and yearly plans?',
    answer: 'Yes! You can switch between plans at any time from your account settings. When upgrading to yearly, you\'ll receive a prorated credit for the remaining time on your monthly plan.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, all new Pro subscribers get a 7-day free trial. You can cancel anytime during the trial period and won\'t be charged.',
  },
  {
    question: 'What happens when I cancel my subscription?',
    answer: 'When you cancel, you\'ll keep Pro access until the end of your current billing period. After that, you\'ll be downgraded to the Free plan but can still access any certificates you\'ve earned.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied with Pro within the first 30 days, contact us for a full refund.',
  },
  {
    question: 'Do you offer team or enterprise plans?',
    answer: 'Yes! Contact us at enterprise@vivancedata.com for custom pricing on team plans with additional features like analytics and admin controls.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through our secure payment partner Stripe.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth()
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to sign in with return URL
      window.location.href = `/sign-in?redirect=/pricing`
      return
    }

    setLoading(planId)

    try {
      const priceId = billingInterval === 'year'
        ? SUBSCRIPTION_PLANS.PRO_YEARLY.priceId
        : SUBSCRIPTION_PLANS.PRO_MONTHLY.priceId

      await redirectToCheckout(priceId)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const currentPlan = billingInterval === 'year' ? SUBSCRIPTION_PLANS.PRO_YEARLY : SUBSCRIPTION_PLANS.PRO_MONTHLY

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Invest in Your Future
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of learners mastering AI and data science.
          Start free, upgrade when you&apos;re ready.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={billingInterval === 'month' ? 'font-semibold' : 'text-muted-foreground'}>
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            billingInterval === 'year' ? 'bg-primary' : 'bg-muted'
          }`}
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
          <Badge variant="default" className="bg-success text-success-foreground">
            Save ${SUBSCRIPTION_PLANS.PRO_YEARLY.savings}
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{SUBSCRIPTION_PLANS.FREE.name}</CardTitle>
            </div>
            <CardDescription>{SUBSCRIPTION_PLANS.FREE.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">{SUBSCRIPTION_PLANS.FREE.priceDisplay}</span>
              <span className="text-muted-foreground">/{SUBSCRIPTION_PLANS.FREE.interval}</span>
            </div>

            <ul className="space-y-3 mb-6">
              {SUBSCRIPTION_PLANS.FREE.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
              {SUBSCRIPTION_PLANS.FREE.limitations.map((limitation) => (
                <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
                  <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={isAuthenticated ? '/dashboard' : '/sign-up'}>
                {isAuthenticated ? 'Current Plan' : 'Get Started Free'}
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-primary shadow-lg">
          {currentPlan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <CardTitle>Pro</CardTitle>
            </div>
            <CardDescription>{currentPlan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">${currentPlan.price}</span>
              <span className="text-muted-foreground">/{currentPlan.interval}</span>
              {billingInterval === 'year' && (
                <div className="text-sm text-muted-foreground mt-1">
                  ${Math.round(SUBSCRIPTION_PLANS.PRO_YEARLY.price / 12)}/month billed annually
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
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
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                'Start Free Trial'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl mx-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4">Feature</th>
                <th className="text-center py-4 px-4">Free</th>
                <th className="text-center py-4 px-4 bg-primary/5">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Course Access', free: '3 courses', pro: 'Unlimited' },
                { feature: 'Learning Paths', free: '1 path', pro: 'All paths' },
                { feature: 'Skill Assessments', free: false, pro: true },
                { feature: 'Verified Certificates', free: false, pro: true },
                { feature: 'Project Feedback', free: 'Community', pro: 'Expert review' },
                { feature: 'Community Discussions', free: true, pro: true },
                { feature: 'Progress Tracking', free: true, pro: true },
                { feature: 'Priority Support', free: false, pro: true },
                { feature: 'Offline Access', free: false, pro: true },
                { feature: 'Early Access to Content', free: false, pro: true },
              ].map((row) => (
                <tr key={row.feature} className="border-b">
                  <td className="py-4 px-4 font-medium">{row.feature}</td>
                  <td className="text-center py-4 px-4">
                    {typeof row.free === 'boolean' ? (
                      row.free ? (
                        <Check className="h-5 w-5 text-success mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">{row.free}</span>
                    )}
                  </td>
                  <td className="text-center py-4 px-4 bg-primary/5">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <Check className="h-5 w-5 text-success mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="font-medium">{row.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-center mb-8">What Pro Members Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: 'The skill assessments helped me identify gaps in my knowledge. Landed a data scientist role within 3 months!',
              name: 'Sarah Chen',
              role: 'Data Scientist at Google',
            },
            {
              quote: 'Worth every penny. The certificates are recognized by employers and the project feedback is invaluable.',
              name: 'Marcus Johnson',
              role: 'ML Engineer at Meta',
            },
            {
              quote: 'Switching from monthly to yearly was a no-brainer. The savings plus the quality of content is unmatched.',
              name: 'Emily Rodriguez',
              role: 'AI Researcher',
            },
          ].map((testimonial) => (
            <Card key={testimonial.name} className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="italic mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-20">
        <div className="flex items-center justify-center gap-2 mb-8">
          <HelpCircle className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join over 10,000 professionals who have transformed their careers with VivanceData.
          Start your 7-day free trial today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => handleSubscribe('pro')} disabled={loading === 'pro'}>
            {loading === 'pro' ? 'Processing...' : 'Start Free Trial'}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required for free plan. Cancel Pro anytime.
        </p>
      </div>
    </div>
  )
}
