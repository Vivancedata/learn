'use client'

import { useEffect } from 'react'

/**
 * Service Worker Registration Component
 * Registers the service worker for PWA functionality
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
      registerServiceWorker()
    }
  }, [])

  return null
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })

    console.log('[PWA] Service worker registered:', registration.scope)

    // Check for updates periodically
    setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000) // Check every hour

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing

      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available
          console.log('[PWA] New content available, refresh to update')

          // Optionally show a toast notification to the user
          if (window.confirm('New version available! Refresh to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
          }
        }
      })
    })

    // Listen for controller changes (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker activated')
    })
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error)
  }
}
