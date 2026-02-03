'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, Download, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

// Declare the beforeinstallprompt event
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface InstallPromptProps {
  /** Minimum number of visits before showing prompt (default: 2) */
  minVisits?: number
  /** Delay in ms before showing prompt after criteria met (default: 3000) */
  showDelay?: number
  /** Whether the prompt is forced visible (for testing) */
  forceShow?: boolean
  /** Additional className */
  className?: string
}

type Platform = 'android' | 'ios' | 'desktop' | 'other'

/**
 * PWA install prompt component
 *
 * Features:
 * - Shows after configurable number of visits
 * - Detects platform (iOS, Android, Desktop)
 * - Shows appropriate instructions for iOS (Add to Home Screen)
 * - Uses native prompt on Android/Desktop
 * - Remembers dismissal with "Don't show again" option
 */
export function InstallPrompt({
  minVisits = 2,
  showDelay = 3000,
  forceShow = false,
  className
}: InstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<Platform>('other')
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  // Detect platform
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ua = navigator.userAgent.toLowerCase()

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect platform
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios')
    } else if (/android/.test(ua)) {
      setPlatform('android')
    } else if (/macintosh|windows|linux/.test(ua) && !/mobile/.test(ua)) {
      setPlatform('desktop')
    }
  }, [])

  // Handle beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  // Check visibility criteria
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isInstalled) return
    if (forceShow) {
      setIsVisible(true)
      return
    }

    // Check if user dismissed permanently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed === 'permanent') return

    // Track visits
    const visits = parseInt(localStorage.getItem('pwa-visit-count') || '0', 10)
    localStorage.setItem('pwa-visit-count', String(visits + 1))

    // Check if we should show
    if (visits + 1 >= minVisits) {
      // Check if dismissed in this session
      const sessionDismissed = sessionStorage.getItem('pwa-install-dismissed')
      if (sessionDismissed) return

      // Show prompt after delay
      const timer = setTimeout(() => {
        // Only show on mobile for now, or if we have a deferred prompt
        if (platform === 'ios' || platform === 'android' || deferredPrompt) {
          setIsVisible(true)
        }
      }, showDelay)

      return () => clearTimeout(timer)
    }
  }, [minVisits, showDelay, forceShow, isInstalled, platform, deferredPrompt])

  // Handle install click
  const handleInstall = useCallback(async () => {
    if (platform === 'ios') {
      setShowIOSInstructions(true)
      return
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
          setIsVisible(false)
          localStorage.setItem('pwa-install-dismissed', 'permanent')
        }

        setDeferredPrompt(null)
      } catch (error) {
        console.error('Install prompt error:', error)
      }
    }
  }, [platform, deferredPrompt])

  // Handle dismiss
  const handleDismiss = useCallback((permanent = false) => {
    setIsVisible(false)
    setShowIOSInstructions(false)

    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', 'permanent')
    } else {
      sessionStorage.setItem('pwa-install-dismissed', 'true')
    }
  }, [])

  // Don't render if not visible or already installed
  if (!isVisible || isInstalled) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in duration-200"
        onClick={() => handleDismiss(false)}
        aria-hidden="true"
      />

      {/* Install Banner */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-background rounded-t-2xl shadow-2xl',
          'animate-in slide-in-from-bottom duration-300',
          'safe-area-bottom',
          className
        )}
        role="dialog"
        aria-labelledby="install-prompt-title"
        aria-describedby="install-prompt-description"
      >
        {/* Handle for visual feedback */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {showIOSInstructions ? (
          // iOS Instructions
          <IOSInstallInstructions onClose={() => setShowIOSInstructions(false)} />
        ) : (
          // Standard Prompt
          <div className="px-6 pb-6">
            {/* Close button */}
            <button
              onClick={() => handleDismiss(false)}
              className={cn(
                'absolute top-4 right-4',
                'w-8 h-8 rounded-full',
                'flex items-center justify-center',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-muted transition-colors',
                'touch-manipulation'
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Download className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Content */}
            <h2
              id="install-prompt-title"
              className="text-xl font-bold text-center mb-2"
            >
              Install VivanceData
            </h2>
            <p
              id="install-prompt-description"
              className="text-sm text-muted-foreground text-center mb-6"
            >
              Add to your home screen for quick access and a better learning experience.
            </p>

            {/* Benefits */}
            <ul className="text-sm space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Learn offline - access your courses anywhere
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Get notified about new content
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Fast loading and smooth experience
              </li>
            </ul>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleInstall}
                className="w-full h-12 text-base touch-manipulation"
              >
                <Download className="h-5 w-5 mr-2" />
                Install App
              </Button>
              <button
                onClick={() => handleDismiss(true)}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              >
                Don&apos;t show again
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * iOS-specific installation instructions
 */
function IOSInstallInstructions({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-6 pb-6">
      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          'absolute top-4 right-4',
          'w-8 h-8 rounded-full',
          'flex items-center justify-center',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-muted transition-colors',
          'touch-manipulation'
        )}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <h2 className="text-xl font-bold text-center mb-6">
        Install on iOS
      </h2>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div>
            <p className="font-medium">Tap the Share button</p>
            <p className="text-sm text-muted-foreground mt-1">
              Look for the share icon
              <Share className="inline h-4 w-4 mx-1" />
              at the bottom of your screen
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div>
            <p className="font-medium">Scroll down and tap</p>
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <Plus className="h-5 w-5 text-primary" />
              <span className="font-medium">Add to Home Screen</span>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div>
            <p className="font-medium">Tap &quot;Add&quot; to install</p>
            <p className="text-sm text-muted-foreground mt-1">
              The app will appear on your home screen
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={onClose}
        variant="outline"
        className="w-full mt-6 h-12 touch-manipulation"
      >
        Got it
      </Button>
    </div>
  )
}

/**
 * Compact install button for use in UI
 */
export function InstallButton({
  className
}: {
  className?: string
}) {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setCanInstall(false)
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error('Install error:', error)
    }
  }

  if (!canInstall) return null

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={cn('gap-2', className)}
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  )
}
