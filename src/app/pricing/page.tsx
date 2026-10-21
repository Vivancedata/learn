import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpCircle } from 'lucide-react'
import PricingPageClient from './page-client'
import { isProTierEnabled } from '@/lib/pro-tier'

export const metadata: Metadata = {
  title: 'Pricing | Vivancedata',
  description: 'Compare plans and choose the best learning path for your goals.',
}

// Only answers the code backs: checkout takes cards through Stripe, and
// cancelling in the Stripe billing portal sets cancel_at_period_end.
const faqs = [
  {
    question: 'What happens when I cancel my subscription?',
    answer: 'You keep Pro access until the end of the billing period you have paid for, then your account moves to the Free plan. Cancel from Settings, which opens the Stripe billing portal.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Credit and debit cards, processed by our payment partner Stripe. We never see or store your full card number.',
  },
] as const

const comparisonRows = [
  { feature: 'Courses and learning paths', free: 'All', pro: 'All' },
  { feature: 'Lessons, quizzes and exercises', free: true, pro: true },
  { feature: 'Progress tracking', free: true, pro: true },
  { feature: 'Community discussions', free: true, pro: true },
  { feature: 'AI tutor', free: 'Daily limit', pro: 'Unlimited' },
  { feature: 'Skill assessments', free: false, pro: true },
  { feature: 'Course certificates', free: false, pro: true },
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
  const proEnabled = isProTierEnabled()

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <div className="mb-16 text-center">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Invest in Your Future
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Structured paths for mastering AI and data science.
          {proEnabled ? ' Start free, upgrade when you’re ready.' : ' Every course is free.'}
        </p>
      </div>

      <PricingPageClient proEnabled={proEnabled} />

      {proEnabled && (
        <>
          <div className="mb-20">
            <h2 className="mb-8 text-center text-2xl font-bold">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="mx-auto w-full max-w-4xl">
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="px-4 py-4 text-left">Feature</th>
                    <th scope="col" className="px-4 py-4 text-center">Free</th>
                    <th scope="col" className="bg-primary/5 px-4 py-4 text-center">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-b">
                      <th scope="row" className="px-4 py-4 text-left font-medium">{row.feature}</th>
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
                      <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180">
                        v
                      </span>
                    </summary>
                    <p className="pb-4 text-muted-foreground">{faq.answer}</p>
                  </details>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
