import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpCircle } from 'lucide-react'
import PricingPageClient from './page-client'

export const metadata: Metadata = {
  title: 'Pricing | Vivance',
  description: 'Compare plans and choose the best learning path for your goals.',
}

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
] as const

const comparisonRows = [
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
] as const

const testimonials = [
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
] as const

function PlanValue({
  highlighted = false,
  value,
}: {
  highlighted?: boolean
  value: boolean | string
}) {
  if (typeof value === 'boolean') {
    return (
      <span className={highlighted || value ? 'font-medium' : 'text-muted-foreground'}>
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  return <span className={highlighted ? 'font-medium' : 'text-muted-foreground'}>{value}</span>
}

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <div className="mb-16 text-center">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Invest in Your Future
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Join thousands of learners mastering AI and data science.
          Start free, upgrade when you&apos;re ready.
        </p>
      </div>

      <PricingPageClient />

      <div className="mb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="mx-auto w-full max-w-4xl">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-4 text-left">Feature</th>
                <th className="px-4 py-4 text-center">Free</th>
                <th className="bg-primary/5 px-4 py-4 text-center">Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b">
                  <td className="px-4 py-4 font-medium">{row.feature}</td>
                  <td className="px-4 py-4 text-center">
                    <PlanValue value={row.free} />
                  </td>
                  <td className="bg-primary/5 px-4 py-4 text-center">
                    <PlanValue value={row.pro} highlighted />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-20">
        <h2 className="mb-8 text-center text-2xl font-bold">What Pro Members Say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mx-auto mb-20 max-w-3xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <HelpCircle className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            {faqs.map((faq) => (
              <details key={faq.question} className="group border-b border-border last:border-0">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-medium [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-180">
                    v
                  </span>
                </summary>
                <p className="pb-4 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
