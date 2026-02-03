/**
 * VivanceData Learning Platform Service Worker
 * Handles caching, push notifications, and background sync
 */

const CACHE_NAME = 'vivancedata-v1'
const STATIC_CACHE_NAME = 'vivancedata-static-v1'
const DYNAMIC_CACHE_NAME = 'vivancedata-dynamic-v1'

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/courses',
  '/api/paths',
  '/api/progress',
]

// ============================================================================
// Installation - Cache static assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error)
      })
  )
})

// ============================================================================
// Activation - Clean up old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== STATIC_CACHE_NAME &&
                     name !== DYNAMIC_CACHE_NAME &&
                     name.startsWith('vivancedata-')
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
        console.log('[SW] Activation complete')
        return self.clients.claim()
      })
  )
})

// ============================================================================
// Fetch - Network-first with cache fallback
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Handle navigation requests with network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Default: network-first for everything else
  event.respondWith(networkFirst(request))
})

// ============================================================================
// Caching Strategies
// ============================================================================

/**
 * Cache-first strategy - return cached response if available
 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Network-first strategy - try network, fall back to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Network-first with offline page fallback for navigation
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('[SW] Navigation failed, showing offline page')

    // Try to return cached version of the page
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    // Fall back to offline page
    const offlinePage = await caches.match('/offline')
    if (offlinePage) {
      return offlinePage
    }

    // Last resort: return a basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - VivanceData</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
            color: #1e293b;
            text-align: center;
            padding: 2rem;
          }
          h1 { color: #6366f1; margin-bottom: 1rem; }
          p { color: #64748b; max-width: 400px; line-height: 1.6; }
          button {
            margin-top: 2rem;
            padding: 0.75rem 1.5rem;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
          }
          button:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Some features may be unavailable until you're back online.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

/**
 * Check if a path is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.webp', '.avif'
  ]
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

// ============================================================================
// Push Notifications
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  let data = {
    title: 'VivanceData',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'default',
    data: { url: '/' }
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch (error) {
      console.error('[SW] Error parsing push data:', error)
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    tag: data.tag || 'default',
    data: data.data || { url: '/' },
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    renotify: data.renotify || false,
  }

  // Add image if provided
  if (data.image) {
    options.image = data.image
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// ============================================================================
// Notification Click Handler
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  // Handle action button clicks
  if (event.action) {
    console.log('[SW] Action clicked:', event.action)
    // Custom action handling can be added here
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }

        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// ============================================================================
// Notification Close Handler
// ============================================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag)
  // Could be used for analytics
})

// ============================================================================
// Background Sync for Progress Updates
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress())
  }

  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncSubmissions())
  }
})

/**
 * Sync pending progress updates when online
 */
async function syncProgress() {
  try {
    // Get pending progress updates from IndexedDB
    const pendingUpdates = await getPendingProgressUpdates()

    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/progress/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        })

        if (response.ok) {
          await removePendingProgressUpdate(update.id)
          console.log('[SW] Progress synced:', update.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync progress:', update.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync progress failed:', error)
  }
}

/**
 * Sync pending project submissions when online
 */
async function syncSubmissions() {
  try {
    // Get pending submissions from IndexedDB
    const pendingSubmissions = await getPendingSubmissions()

    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission.data)
        })

        if (response.ok) {
          await removePendingSubmission(submission.id)
          console.log('[SW] Submission synced:', submission.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync submission:', submission.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync submissions failed:', error)
  }
}

// ============================================================================
// IndexedDB Helpers for Background Sync
// ============================================================================

const DB_NAME = 'vivancedata-offline'
const DB_VERSION = 1

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('pending-progress')) {
        db.createObjectStore('pending-progress', { keyPath: 'id', autoIncrement: true })
      }

      if (!db.objectStoreNames.contains('pending-submissions')) {
        db.createObjectStore('pending-submissions', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function getPendingProgressUpdates() {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-progress', 'readonly')
    const store = transaction.objectStore('pending-progress')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function removePendingProgressUpdate(id) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-progress', 'readwrite')
    const store = transaction.objectStore('pending-progress')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function getPendingSubmissions() {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-submissions', 'readonly')
    const store = transaction.objectStore('pending-submissions')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function removePendingSubmission(id) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-submissions', 'readwrite')
    const store = transaction.objectStore('pending-submissions')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ============================================================================
// Message Handler - Communication with main thread
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)))
      }).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    )
  }
})

console.log('[SW] Service worker loaded')
