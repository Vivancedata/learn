/**
 * Push Notifications Hook
 * Manages push notification subscription and permissions
 */

import { useState, useEffect, useCallback } from 'react'

// VAPID public key - should match server configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export interface UsePushNotificationsResult {
  // Permission state
  permission: PermissionState
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null

  // Actions
  requestPermission: () => Promise<boolean>
  subscribe: (userId: string) => Promise<boolean>
  unsubscribe: (userId: string) => Promise<boolean>
  sendTestNotification: (userId: string) => Promise<boolean>
}

/**
 * Convert a base64 string to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Check if push notifications are supported
 */
function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false

  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Get current notification permission state
 */
function getPermissionState(): PermissionState {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission as PermissionState
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = isPushSupported()

  // Check initial permission and subscription state
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }

    setPermission(getPermissionState())

    // Check if already subscribed
    checkSubscriptionStatus()
  }, [isSupported])

  /**
   * Check current subscription status
   */
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSupported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (_err) {
      // Failed to check subscription - default to not subscribed
    }
  }, [isSupported])

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)

      if (result === 'granted') {
        return true
      } else if (result === 'denied') {
        setError('Notification permission was denied')
        return false
      } else {
        setError('Notification permission was dismissed')
        return false
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (userId: string): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported')
      return false
    }

    if (!VAPID_PUBLIC_KEY) {
      setError('Push notifications are not configured')
      return false
    }

    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        })
      }

      // Get subscription keys
      const p256dh = subscription.getKey('p256dh')
      const auth = subscription.getKey('auth')

      if (!p256dh || !auth) {
        throw new Error('Failed to get subscription keys')
      }

      // Convert keys to base64
      const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(p256dh)))
      const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)))

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: p256dhBase64,
              auth: authBase64,
            },
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to save subscription')
      }

      setIsSubscribed(true)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, permission, requestPermission])

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (userId: string): Promise<boolean> => {
    if (!isSupported) {
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        setIsSubscribed(false)
        return true
      }

      // Unsubscribe from browser
      await subscription.unsubscribe()

      // Remove from server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint,
        }),
      })

      // Server unsubscribe may fail but browser is unsubscribed - that's OK
      void response

      setIsSubscribed(false)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  /**
   * Send a test notification
   */
  const sendTestNotification = useCallback(async (userId: string): Promise<boolean> => {
    if (!isSubscribed) {
      setError('Not subscribed to push notifications')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: 'Test Notification',
          body: 'This is a test notification from VivanceData Learning!',
          tag: 'test',
          url: '/settings',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send test notification')
      }

      const data = await response.json()

      if (!data.data?.sent) {
        setError(data.data?.reason || 'Notification was not sent')
        return false
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send notification'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSubscribed])

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  }
}
