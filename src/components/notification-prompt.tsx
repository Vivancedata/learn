'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/hooks/useAuth'

const STORAGE_KEY = 'notification-prompt-dismissed'
const FIRST_LESSON_KEY = 'first-lesson-completed'

interface NotificationPromptProps {
  /** Show prompt immediately without waiting for first lesson */
  showImmediately?: boolean
  /** Custom trigger condition */
  show?: boolean
  /** Callback when user enables notifications */
  onEnabled?: () => void
  /** Callback when user dismisses prompt */
  onDismissed?: () => void
}

/**
 * Notification Prompt Component
 * Displays a friendly prompt to enable push notifications
 * By default, shows after the user completes their first lesson
 */
export function NotificationPrompt({
  showImmediately = false,
  show: showProp,
  onEnabled,
  onDismissed,
}: NotificationPromptProps) {
  const { user } = useAuth()
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
  } = usePushNotifications()

  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if prompt should be shown
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Don't show if not supported or already subscribed
    if (!isSupported || isSubscribed) {
      setIsVisible(false)
      return
    }

    // Don't show if permission already denied
    if (permission === 'denied') {
      setIsVisible(false)
      return
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      setIsDismissed(true)
      setIsVisible(false)
      return
    }

    // Use prop control if provided
    if (showProp !== undefined) {
      setIsVisible(showProp)
      return
    }

    // Show immediately if requested
    if (showImmediately && user) {
      setIsVisible(true)
      return
    }

    // Check if first lesson completed
    const firstLessonCompleted = localStorage.getItem(FIRST_LESSON_KEY)
    if (firstLessonCompleted && user) {
      setIsVisible(true)
    }
  }, [isSupported, isSubscribed, permission, showImmediately, showProp, user])

  // Handle enable button click
  const handleEnable = async () => {
    if (!user) return

    const success = await subscribe(user.id)

    if (success) {
      setIsVisible(false)
      onEnabled?.()
    }
  }

  // Handle dismiss/later button click
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsDismissed(true)
    setIsVisible(false)
    onDismissed?.()
  }

  // Don't render if not visible or already dismissed
  if (!isVisible || isDismissed || !user) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Stay on track with notifications
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get reminders to maintain your streak, celebrate achievements,
                and stay updated on your courses.
              </p>

              {error && (
                <p className="text-sm text-destructive mb-2">{error}</p>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  disabled={isLoading}
                >
                  {isLoading ? 'Enabling...' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isLoading}
                >
                  Maybe later
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Utility function to mark first lesson as completed
 * Call this when a user completes their first lesson
 */
export function markFirstLessonCompleted() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(FIRST_LESSON_KEY, 'true')
    // Dispatch custom event to trigger prompt
    window.dispatchEvent(new CustomEvent('first-lesson-completed'))
  }
}

/**
 * Utility function to reset notification prompt state
 * Useful for testing
 */
export function resetNotificationPromptState() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(FIRST_LESSON_KEY)
  }
}
