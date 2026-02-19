'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Crown, ArrowRight, Sparkles } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Refresh user data to get updated subscription status
    const refreshSubscription = async () => {
      try {
        await refreshUser()
      } catch (_error) {
        // Refresh failed - user may need to reload page
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure webhook has processed
    const timer = setTimeout(refreshSubscription, 2000)
    return () => clearTimeout(timer)
  }, [refreshUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your Pro account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome to Pro!
        </h1>
        <p className="text-muted-foreground">
          Your subscription is now active. Let&apos;s start your learning journey.
        </p>
        {sessionId && (
          <p className="text-xs text-muted-foreground mt-2">
            Order reference: {sessionId.slice(-8).toUpperCase()}
          </p>
        )}
      </div>

      <Card className="mb-8 border-success/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <CardTitle>Pro Features Unlocked</CardTitle>
          </div>
          <CardDescription>
            You now have access to all premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              'Unlimited access to all courses',
              'All learning paths',
              'Skill assessments to track your progress',
              'Verified certificates for completed courses',
              'Priority support from our team',
              'Expert project feedback',
              'Offline access to lessons',
              'Early access to new content',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Recommended Next Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Take a Skill Assessment</p>
              <p className="text-sm text-muted-foreground">
                Discover your strengths and areas for improvement
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/assessments">
                Start
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Explore Learning Paths</p>
              <p className="text-sm text-muted-foreground">
                Follow a structured curriculum to reach your goals
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/paths">
                Explore
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Browse All Courses</p>
              <p className="text-sm text-muted-foreground">
                Access our entire library of AI and data science courses
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/courses">
                Browse
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" asChild>
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/settings">Manage Subscription</Link>
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Need help? Contact us at{' '}
        <a href="mailto:support@vivancedata.com" className="text-primary hover:underline">
          support@vivancedata.com
        </a>
      </p>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <ProtectedRoute>
      <CheckoutSuccessContent />
    </ProtectedRoute>
  )
}
