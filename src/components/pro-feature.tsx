'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Lock, X, Sparkles } from 'lucide-react'

// ============================================================================
// ProFeature Wrapper Component
// ============================================================================

interface ProFeatureProps {
  children: ReactNode
  /**
   * What to show when user doesn't have Pro access
   * - 'blur': Blur the content with an overlay
   * - 'hide': Completely hide the content
   * - 'disabled': Show content but disable interactions
   * - 'custom': Use the fallback prop
   */
  behavior?: 'blur' | 'hide' | 'disabled' | 'custom'
  /**
   * Custom fallback content when user doesn't have Pro
   */
  fallback?: ReactNode
  /**
   * Feature name for the upgrade prompt
   */
  featureName?: string
  /**
   * Feature description for the upgrade prompt
   */
  featureDescription?: string
  /**
   * Show a compact upgrade prompt
   */
  compact?: boolean
}

export function ProFeature({
  children,
  behavior = 'blur',
  fallback,
  featureName = 'This feature',
  featureDescription,
  compact = false,
}: ProFeatureProps) {
  const { isPro, loading } = useSubscription()

  // Show content while loading to prevent layout shift
  if (loading) {
    return <>{children}</>
  }

  // Show content for Pro users
  if (isPro) {
    return <>{children}</>
  }

  // Handle different behaviors for non-Pro users
  switch (behavior) {
    case 'hide':
      return null

    case 'custom':
      return <>{fallback}</>

    case 'disabled':
      return (
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
      )

    case 'blur':
    default:
      return (
        <div className="relative">
          {/* Blurred content */}
          <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
            {children}
          </div>

          {/* Upgrade overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            {compact ? (
              <CompactUpgradePrompt featureName={featureName} />
            ) : (
              <UpgradePrompt
                featureName={featureName}
                featureDescription={featureDescription}
              />
            )}
          </div>
        </div>
      )
  }
}

// ============================================================================
// Upgrade Prompt Components
// ============================================================================

interface UpgradePromptProps {
  featureName: string
  featureDescription?: string
}

function UpgradePrompt({ featureName, featureDescription }: UpgradePromptProps) {
  return (
    <Card className="max-w-sm mx-4 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Pro Feature</CardTitle>
        <CardDescription>
          {featureDescription || `${featureName} requires a Pro subscription`}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center pt-2">
        <Button asChild>
          <Link href="/pricing">
            Upgrade to Pro
            <Sparkles className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function CompactUpgradePrompt({ featureName }: { featureName: string }) {
  return (
    <div className="text-center p-4">
      <Badge variant="secondary" className="mb-2">
        <Lock className="h-3 w-3 mr-1" />
        Pro Feature
      </Badge>
      <p className="text-sm text-muted-foreground mb-3">
        {featureName} requires Pro
      </p>
      <Button size="sm" asChild>
        <Link href="/pricing">Upgrade</Link>
      </Button>
    </div>
  )
}

// ============================================================================
// Upgrade Modal Component
// ============================================================================

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureName?: string
  featureDescription?: string
}

export function UpgradeModal({
  isOpen,
  onClose,
  featureName = 'This feature',
  featureDescription,
}: UpgradeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 max-w-md mx-4 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Upgrade to Pro</CardTitle>
          <CardDescription>
            {featureDescription || `Unlock ${featureName} and more with Pro`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ul className="space-y-2">
            {[
              'Unlimited course access',
              'Skill assessments',
              'Verified certificates',
              'Priority support',
              'Expert project feedback',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" asChild>
            <Link href="/pricing">
              View Plans
              <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// ============================================================================
// Pro Badge Component
// ============================================================================

interface ProBadgeProps {
  className?: string
  showText?: boolean
}

export function ProBadge({ className = '', showText = true }: ProBadgeProps) {
  return (
    <Badge variant="default" className={`bg-primary ${className}`}>
      <Crown className="h-3 w-3" />
      {showText && <span className="ml-1">Pro</span>}
    </Badge>
  )
}

// ============================================================================
// Hook for Upgrade Modal
// ============================================================================

export function useUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState<{
    featureName?: string
    featureDescription?: string
  }>({})

  const open = (featureName?: string, featureDescription?: string) => {
    setContext({ featureName, featureDescription })
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    open,
    close,
    ...context,
  }
}
