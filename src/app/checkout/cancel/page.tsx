'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowRight, HelpCircle, MessageCircle, RefreshCw } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <XCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Checkout Cancelled
        </h1>
        <p className="text-muted-foreground">
          Your payment was not processed. No charges were made.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What happened?</CardTitle>
          <CardDescription>
            The checkout process was cancelled before completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Don&apos;t worry - your account is safe and no payment was taken.
            You can continue using the free plan or try upgrading again when you&apos;re ready.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Common reasons for cancellation:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Wanted to review the pricing again</li>
              <li>Needed to check with a manager or team</li>
              <li>Technical issue with payment method</li>
              <li>Changed mind about the plan</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Need Help Deciding?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Compare Plans</p>
              <p className="text-sm text-muted-foreground">
                See a detailed breakdown of Free vs Pro features
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">
                Compare
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Browse Free Courses</p>
              <p className="text-sm text-muted-foreground">
                Try our free content before upgrading
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/courses">
                Browse
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Talk to Our Team</p>
              <p className="text-sm text-muted-foreground">
                Have questions? We&apos;re happy to help
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@vivancedata.com">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <Link href="/pricing">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Questions about Pro?{' '}
        <a href="mailto:support@vivancedata.com" className="text-primary hover:underline">
          Contact our team
        </a>
        {' '}for a personalized recommendation.
      </p>
    </div>
  )
}
