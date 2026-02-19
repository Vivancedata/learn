'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Clock, Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/hooks/useAuth'

interface NotificationPreferences {
  streakReminders: boolean
  courseUpdates: boolean
  achievementAlerts: boolean
  weeklyProgress: boolean
  communityReplies: boolean
  marketingEmails: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
}

/**
 * Notification Preferences Component
 * Allows users to manage their push notification settings
 */
export function NotificationPreferences() {
  const { user } = useAuth()
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading: pushLoading,
    error: pushError,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications()

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    streakReminders: true,
    courseUpdates: true,
    achievementAlerts: true,
    weeklyProgress: true,
    communityReplies: true,
    marketingEmails: false,
    quietHoursStart: null,
    quietHoursEnd: null,
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testSent, setTestSent] = useState(false)

  const fetchPreferences = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/notifications/preferences/${user.id}`)

      if (!response.ok) {
        throw new Error('Failed to load preferences')
      }

      const data = await response.json()
      setPreferences(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }, [user])

  const savePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/notifications/preferences/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      const data = await response.json()
      setPreferences(data.data)
      setSuccess('Preferences saved')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }, [user])

  // Fetch preferences on mount
  useEffect(() => {
    if (user) {
      fetchPreferences()
    }
  }, [fetchPreferences, user])

  const togglePreference = useCallback((key: keyof NotificationPreferences) => {
    const currentValue = preferences[key]
    if (typeof currentValue !== 'boolean') return

    const newValue = !currentValue
    setPreferences(prev => ({ ...prev, [key]: newValue }))
    savePreferences({ [key]: newValue })
  }, [preferences, savePreferences])

  const handleSubscriptionToggle = async () => {
    if (!user) return

    if (isSubscribed) {
      await unsubscribe(user.id)
    } else {
      await subscribe(user.id)
    }
  }

  const handleTestNotification = async () => {
    if (!user) return

    const success = await sendTestNotification(user.id)
    if (success) {
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    }
  }

  const handleQuietHoursChange = useCallback((type: 'start' | 'end', value: string) => {
    const hour = value ? parseInt(value, 10) : null
    const key = type === 'start' ? 'quietHoursStart' : 'quietHoursEnd'

    setPreferences(prev => ({ ...prev, [key]: hour }))

    // Only save if both are set or both are null
    const otherKey = type === 'start' ? 'quietHoursEnd' : 'quietHoursStart'
    const otherValue = preferences[otherKey]

    if ((hour !== null && otherValue !== null) || (hour === null && otherValue === null)) {
      savePreferences({ [key]: hour })
    }
  }, [preferences, savePreferences])

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error/Success Messages */}
        {(error || pushError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || pushError}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">{success}</AlertDescription>
          </Alert>
        )}

        {/* Subscription Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <h3 className="font-medium">
              {isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'You will receive push notifications based on your preferences below'
                : permission === 'denied'
                  ? 'Notification permission was denied. Please enable in browser settings.'
                  : 'Enable push notifications to stay updated'}
            </p>
          </div>
          <Button
            variant={isSubscribed ? 'outline' : 'default'}
            onClick={handleSubscriptionToggle}
            disabled={pushLoading || permission === 'denied'}
          >
            {pushLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isSubscribed ? (
              <BellOff className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {isSubscribed ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Notification Types */}
        {isSubscribed && (
          <>
            <div className="space-y-4">
              <h3 className="font-medium">Notification Types</h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  <PreferenceToggle
                    label="Streak Reminders"
                    description="Daily reminders to maintain your learning streak"
                    checked={preferences.streakReminders}
                    onChange={() => togglePreference('streakReminders')}
                    disabled={saving}
                  />

                  <PreferenceToggle
                    label="Course Updates"
                    description="Notifications about new lessons and course content"
                    checked={preferences.courseUpdates}
                    onChange={() => togglePreference('courseUpdates')}
                    disabled={saving}
                  />

                  <PreferenceToggle
                    label="Achievement Alerts"
                    description="Celebrate when you unlock new achievements"
                    checked={preferences.achievementAlerts}
                    onChange={() => togglePreference('achievementAlerts')}
                    disabled={saving}
                  />

                  <PreferenceToggle
                    label="Weekly Progress"
                    description="Weekly summary of your learning progress"
                    checked={preferences.weeklyProgress}
                    onChange={() => togglePreference('weeklyProgress')}
                    disabled={saving}
                  />

                  <PreferenceToggle
                    label="Community Replies"
                    description="Notifications when someone replies to your discussions"
                    checked={preferences.communityReplies}
                    onChange={() => togglePreference('communityReplies')}
                    disabled={saving}
                  />

                  <PreferenceToggle
                    label="Marketing Updates"
                    description="Occasional updates about new features and promotions"
                    checked={preferences.marketingEmails}
                    onChange={() => togglePreference('marketingEmails')}
                    disabled={saving}
                  />
                </div>
              )}
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Quiet Hours</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                No notifications will be sent during quiet hours
              </p>

              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start</Label>
                  <select
                    id="quiet-start"
                    value={preferences.quietHoursStart ?? ''}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={saving}
                  >
                    <option value="">None</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End</Label>
                  <select
                    id="quiet-end"
                    value={preferences.quietHoursEnd ?? ''}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={saving}
                  >
                    <option value="">None</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Test Notification */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={pushLoading || testSent}
              >
                {pushLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : testSent ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {testSent ? 'Notification Sent!' : 'Send Test Notification'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual preference toggle component
 */
interface PreferenceToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 mr-4">
        <Label className="font-medium cursor-pointer" onClick={onChange}>
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        variant={checked ? 'default' : 'outline'}
        size="sm"
        onClick={onChange}
        disabled={disabled}
        aria-pressed={checked}
      >
        {checked ? 'On' : 'Off'}
      </Button>
    </div>
  )
}
