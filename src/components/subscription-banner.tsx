'use client'

import Link from 'next/link'
import { useSubscriptionStatus } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, AlertTriangle, Info, X } from 'lucide-react'
import { useState } from 'react'

interface SubscriptionBannerProps {
  className?: string
  dismissible?: boolean
}

/**
 * Banner component that displays subscription status alerts
 * Shows warnings for trials ending, subscriptions cancelling, or payment issues
 */
export function SubscriptionBanner({ className = '', dismissible = true }: SubscriptionBannerProps) {
  const { statusMessage, loading } = useSubscriptionStatus()
  const [dismissed, setDismissed] = useState(false)

  if (loading || !statusMessage || dismissed) {
    return null
  }

  const getIcon = () => {
    switch (statusMessage.type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = () => {
    switch (statusMessage.type) {
      case 'warning':
        return 'default'
      case 'error':
        return 'destructive'
      case 'info':
      default:
        return 'default'
    }
  }

  return (
    <Alert variant={getVariant()} className={`relative ${className}`}>
      {getIcon()}
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{statusMessage.message}</span>
        <div className="flex items-center gap-2">
          {statusMessage.type !== 'info' && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/settings">Manage</Link>
            </Button>
          )}
          {statusMessage.type === 'info' && statusMessage.message.includes('Upgrade') && (
            <Button size="sm" asChild>
              <Link href="/pricing">
                <Crown className="h-3 w-3 mr-1" />
                Upgrade
              </Link>
            </Button>
          )}
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Compact inline banner for showing within page content
 */
export function SubscriptionStatusInline() {
  const { statusMessage, isPro, loading } = useSubscriptionStatus()

  if (loading) return null

  // Show upgrade prompt for free users
  if (!isPro) {
    return (
      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <Crown className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground flex-1">
          Upgrade to Pro for unlimited access
        </span>
        <Button size="sm" asChild>
          <Link href="/pricing">Upgrade</Link>
        </Button>
      </div>
    )
  }

  // Show status message for Pro users if applicable
  if (statusMessage && statusMessage.type !== 'info') {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${
        statusMessage.type === 'warning' ? 'bg-warning/10 border-warning/20' :
        statusMessage.type === 'error' ? 'bg-destructive/10 border-destructive/20' :
        'bg-muted border-border'
      }`}>
        <AlertTriangle className={`h-4 w-4 ${
          statusMessage.type === 'warning' ? 'text-warning' :
          statusMessage.type === 'error' ? 'text-destructive' :
          'text-muted-foreground'
        }`} />
        <span className="text-sm flex-1">{statusMessage.message}</span>
        <Button size="sm" variant="outline" asChild>
          <Link href="/settings">Manage</Link>
        </Button>
      </div>
    )
  }

  return null
}
