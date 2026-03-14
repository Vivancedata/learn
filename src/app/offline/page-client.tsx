'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-4 bg-muted rounded-full mb-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>

      <h1 className="text-3xl font-bold mb-2">You&apos;re Offline</h1>

      <p className="text-muted-foreground max-w-md mb-8">
        It looks like you&apos;ve lost your internet connection.
        Some features may be unavailable until you&apos;re back online.
      </p>

      <div className="space-y-4">
        <Button
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        <p className="text-sm text-muted-foreground">
          Your progress has been saved locally and will sync when you reconnect.
        </p>
      </div>

      <div className="mt-12 p-6 bg-muted/50 rounded-lg max-w-md">
        <h2 className="font-semibold mb-2">Available Offline</h2>
        <ul className="text-sm text-muted-foreground space-y-1 text-left">
          <li>- Previously viewed course content</li>
          <li>- Your learning progress</li>
          <li>- Downloaded resources</li>
        </ul>
      </div>
    </div>
  )
}
