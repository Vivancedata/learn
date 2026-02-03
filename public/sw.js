/**
 * VivanceData Learning Platform Service Worker
 * Handles caching, push notifications, background sync, and offline support
 * @version 2.0.0
 */

const CACHE_VERSION = 'v2'
const STATIC_CACHE_NAME = `vivancedata-static-${CACHE_VERSION}`
const DYNAMIC_CACHE_NAME = `vivancedata-dynamic-${CACHE_VERSION}`
const COURSE_CACHE_NAME = `vivancedata-courses-${CACHE_VERSION}`
const IMAGE_CACHE_NAME = `vivancedata-images-${CACHE_VERSION}`

// Cache limits
const DYNAMIC_CACHE_LIMIT = 50
const IMAGE_CACHE_LIMIT = 100
const COURSE_CACHE_LIMIT = 20

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Routes that should use stale-while-revalidate
const STALE_WHILE_REVALIDATE_ROUTES = [
  '/api/courses',
  '/api/paths',
  '/api/leaderboard',
]

// Routes that should always hit network first
const NETWORK_FIRST_ROUTES = [
  '/api/auth',
  '/api/progress',
  '/api/projects',
  '/api/quiz',
  '/api/discussions',
]

// Course content patterns to cache for offline viewing
const COURSE_CONTENT_PATTERNS = [
  /^\/api\/courses\/[^/]+$/,
  /^\/api\/lessons\/[^/]+$/,
  /^\/courses\/[^/]+\/lessons\/[^/]+$/,
]

// ============================================================================
// Installation - Cache static assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...')

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

  const currentCaches = [
    STATIC_CACHE_NAME,
    DYNAMIC_CACHE_NAME,
    COURSE_CACHE_NAME,
    IMAGE_CACHE_NAME,
  ]

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('vivancedata-') && !currentCaches.includes(name)
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
// Fetch - Advanced caching strategies
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

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // Check for stale-while-revalidate routes
    if (shouldUseStaleWhileRevalidate(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME))
      return
    }

    // Check for course content that should be cached
    if (isCourseContent(url.pathname)) {
      event.respondWith(courseContentStrategy(request))
      return
    }

    // Network-first for authenticated/dynamic endpoints
    if (shouldUseNetworkFirst(url.pathname)) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME))
      return
    }

    // Default: network-first for other API calls
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME))
    return
  }

  // Handle images with cache-first + limit
  if (isImageRequest(url.pathname)) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE_NAME, IMAGE_CACHE_LIMIT))
    return
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME))
    return
  }

  // Handle navigation requests with network-first + offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request))
    return
  }

  // Default: stale-while-revalidate for everything else
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME))
})

// ============================================================================
// Caching Strategies
// ============================================================================

/**
 * Cache-first strategy - return cached response if available
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error)
    return createOfflineResponse()
  }
}

/**
 * Cache-first with cache size limit
 */
async function cacheFirstWithLimit(request, cacheName, limit) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)

      // Limit cache size
      const keys = await cache.keys()
      if (keys.length >= limit) {
        await cache.delete(keys[0])
      }

      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error)
    return createOfflineResponse()
  }
}

/**
 * Network-first strategy - try network, fall back to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    return createJsonErrorResponse('Offline', 'No cached data available')
  }
}

/**
 * Stale-while-revalidate strategy - return cached immediately, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        // Limit cache size
        limitCacheSize(cacheName, DYNAMIC_CACHE_LIMIT)
        cache.put(request, response.clone())
      }
      return response
    })
    .catch((error) => {
      console.log('[SW] Fetch failed in stale-while-revalidate:', error)
      return null
    })

  // Return cached response immediately, or wait for network
  return cached || fetchPromise || createJsonErrorResponse('Offline', 'No cached data available')
}

/**
 * Course content caching strategy - prioritize offline availability
 */
async function courseContentStrategy(request) {
  const cache = await caches.open(COURSE_CACHE_NAME)

  try {
    const response = await fetch(request)

    if (response.ok) {
      // Clone and cache the response
      cache.put(request, response.clone())

      // Also cache related course data
      const data = await response.clone().json()
      await cacheRelatedCourseContent(data)
    }

    return response
  } catch (error) {
    console.log('[SW] Network failed for course content, using cache:', request.url)

    const cached = await cache.match(request)
    if (cached) {
      // Add header to indicate this is cached content
      const headers = new Headers(cached.headers)
      headers.set('X-Cache-Status', 'HIT')
      headers.set('X-Cached-At', new Date().toISOString())

      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers
      })
    }

    return createJsonErrorResponse('Offline', 'Course content not available offline')
  }
}

/**
 * Cache related course content for offline viewing
 */
async function cacheRelatedCourseContent(data) {
  // This would cache related lessons, sections, etc.
  // Implementation depends on data structure
  if (data && data.data && data.data.sections) {
    const cache = await caches.open(COURSE_CACHE_NAME)

    for (const section of data.data.sections) {
      for (const lesson of section.lessons || []) {
        const lessonUrl = `/api/lessons/${lesson.id}`
        try {
          const response = await fetch(lessonUrl)
          if (response.ok) {
            await cache.put(lessonUrl, response)
          }
        } catch (e) {
          // Silently fail for related content
        }
      }
    }
  }
}

/**
 * Navigation strategy - network-first with offline page fallback
 */
async function navigationStrategy(request) {
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

    // Last resort: return inline offline response
    return createOfflinePageResponse()
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function shouldUseStaleWhileRevalidate(pathname) {
  return STALE_WHILE_REVALIDATE_ROUTES.some(route => pathname.startsWith(route))
}

function shouldUseNetworkFirst(pathname) {
  return NETWORK_FIRST_ROUTES.some(route => pathname.startsWith(route))
}

function isCourseContent(pathname) {
  return COURSE_CONTENT_PATTERNS.some(pattern => pattern.test(pathname))
}

function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.woff', '.woff2', '.ttf', '.eot'
  ]
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

function isImageRequest(pathname) {
  const imageExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif'
  ]
  return imageExtensions.some(ext => pathname.endsWith(ext))
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxSize) {
    const keysToDelete = keys.slice(0, keys.length - maxSize)
    await Promise.all(keysToDelete.map(key => cache.delete(key)))
  }
}

function createJsonErrorResponse(error, message) {
  return new Response(
    JSON.stringify({ error, message, offline: true }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

function createOfflineResponse() {
  return new Response('Offline', { status: 503 })
}

function createOfflinePageResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - VivanceData</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
          text-align: center;
          padding: 2rem;
        }
        .icon {
          width: 80px;
          height: 80px;
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }
        h1 {
          color: #6366f1;
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
        }
        p {
          color: #94a3b8;
          max-width: 400px;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        button {
          padding: 0.875rem 2rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        button:hover {
          background: #4f46e5;
          transform: translateY(-2px);
        }
        button:active {
          transform: translateY(0);
        }
        .cached-pages {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #334155;
        }
        .cached-pages h2 {
          font-size: 1rem;
          color: #94a3b8;
          margin-bottom: 1rem;
        }
        .cached-pages a {
          display: inline-block;
          color: #6366f1;
          text-decoration: none;
          padding: 0.5rem 1rem;
          margin: 0.25rem;
          border: 1px solid #6366f1;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        .cached-pages a:hover {
          background: #6366f1;
          color: white;
        }
      </style>
    </head>
    <body>
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
      </svg>
      <h1>You're Offline</h1>
      <p>It looks like you've lost your internet connection. Some content may still be available from your recent visits.</p>
      <button onclick="window.location.reload()">Try Again</button>
      <div class="cached-pages" id="cachedPages">
        <h2>Recently viewed pages</h2>
      </div>
      <script>
        // Show cached pages
        if ('caches' in window) {
          caches.open('vivancedata-dynamic-v2').then(cache => {
            cache.keys().then(keys => {
              const container = document.getElementById('cachedPages');
              const links = keys
                .filter(req => req.url.includes('/courses/') || req.url.includes('/dashboard'))
                .slice(0, 5)
                .map(req => {
                  const url = new URL(req.url);
                  return '<a href="' + url.pathname + '">' + url.pathname + '</a>';
                });
              if (links.length > 0) {
                container.innerHTML += links.join('');
              } else {
                container.style.display = 'none';
              }
            });
          });
        }
      </script>
    </body>
    </html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  )
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
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    renotify: data.renotify || false,
    silent: false,
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

  // Handle dismiss action
  if (event.action === 'dismiss') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

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

  if (event.tag === 'sync-quiz') {
    event.waitUntil(syncQuizAnswers())
  }
})

/**
 * Sync pending progress updates when online
 */
async function syncProgress() {
  try {
    const pendingUpdates = await getPendingData('pending-progress')

    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/progress/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        })

        if (response.ok) {
          await removePendingData('pending-progress', update.id)
          console.log('[SW] Progress synced:', update.id)

          // Notify clients of successful sync
          notifyClients({ type: 'SYNC_SUCCESS', data: { type: 'progress', id: update.id } })
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
    const pendingSubmissions = await getPendingData('pending-submissions')

    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission.data)
        })

        if (response.ok) {
          await removePendingData('pending-submissions', submission.id)
          console.log('[SW] Submission synced:', submission.id)

          notifyClients({ type: 'SYNC_SUCCESS', data: { type: 'submission', id: submission.id } })
        }
      } catch (error) {
        console.error('[SW] Failed to sync submission:', submission.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync submissions failed:', error)
  }
}

/**
 * Sync pending quiz answers when online
 */
async function syncQuizAnswers() {
  try {
    const pendingQuizzes = await getPendingData('pending-quizzes')

    for (const quiz of pendingQuizzes) {
      try {
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quiz.data)
        })

        if (response.ok) {
          await removePendingData('pending-quizzes', quiz.id)
          console.log('[SW] Quiz synced:', quiz.id)

          notifyClients({ type: 'SYNC_SUCCESS', data: { type: 'quiz', id: quiz.id } })
        }
      } catch (error) {
        console.error('[SW] Failed to sync quiz:', quiz.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync quizzes failed:', error)
  }
}

/**
 * Notify all clients of an event
 */
async function notifyClients(message) {
  const allClients = await clients.matchAll({ type: 'window' })
  for (const client of allClients) {
    client.postMessage(message)
  }
}

// ============================================================================
// IndexedDB Helpers for Background Sync
// ============================================================================

const DB_NAME = 'vivancedata-offline'
const DB_VERSION = 2

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      const stores = [
        'pending-progress',
        'pending-submissions',
        'pending-quizzes',
        'cached-courses'
      ]

      for (const storeName of stores) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
        }
      }
    }
  })
}

async function getPendingData(storeName) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function removePendingData(storeName, id) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ============================================================================
// Periodic Background Sync (for browsers that support it)
// ============================================================================

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag)

  if (event.tag === 'update-content') {
    event.waitUntil(updateCachedContent())
  }
})

/**
 * Update cached content in the background
 */
async function updateCachedContent() {
  try {
    // Refresh course list cache
    const response = await fetch('/api/courses')
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      await cache.put('/api/courses', response)
      console.log('[SW] Course list cache updated')
    }
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error)
  }
}

// ============================================================================
// Message Handler - Communication with main thread
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  const { type, payload } = event.data || {}

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_VERSION })
      break

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((names) => {
          return Promise.all(names.map((name) => caches.delete(name)))
        }).then(() => {
          event.ports[0]?.postMessage({ success: true })
        })
      )
      break

    case 'CACHE_COURSE':
      event.waitUntil(cacheCourseForOffline(payload?.courseId))
      break

    case 'GET_CACHED_COURSES':
      event.waitUntil(
        getCachedCourses().then(courses => {
          event.ports[0]?.postMessage({ courses })
        })
      )
      break

    case 'CHECK_CACHE_STATUS':
      event.waitUntil(
        checkCacheStatus(payload?.url).then(status => {
          event.ports[0]?.postMessage({ status })
        })
      )
      break
  }
})

/**
 * Cache a specific course for offline viewing
 */
async function cacheCourseForOffline(courseId) {
  if (!courseId) return

  try {
    const cache = await caches.open(COURSE_CACHE_NAME)

    // Fetch and cache the course
    const courseUrl = `/api/courses/${courseId}`
    const courseResponse = await fetch(courseUrl)

    if (courseResponse.ok) {
      await cache.put(courseUrl, courseResponse.clone())

      // Cache all lessons in the course
      const courseData = await courseResponse.json()
      if (courseData.data?.sections) {
        for (const section of courseData.data.sections) {
          for (const lesson of section.lessons || []) {
            try {
              const lessonUrl = `/api/lessons/${lesson.id}`
              const lessonResponse = await fetch(lessonUrl)
              if (lessonResponse.ok) {
                await cache.put(lessonUrl, lessonResponse)
              }
            } catch (e) {
              console.error('[SW] Failed to cache lesson:', lesson.id)
            }
          }
        }
      }

      console.log('[SW] Course cached for offline:', courseId)
      notifyClients({ type: 'COURSE_CACHED', data: { courseId } })
    }
  } catch (error) {
    console.error('[SW] Failed to cache course:', courseId, error)
    notifyClients({ type: 'CACHE_ERROR', data: { courseId, error: error.message } })
  }
}

/**
 * Get list of courses available offline
 */
async function getCachedCourses() {
  try {
    const cache = await caches.open(COURSE_CACHE_NAME)
    const keys = await cache.keys()

    const courseUrls = keys
      .map(req => req.url)
      .filter(url => url.includes('/api/courses/') && !url.includes('/lessons/'))

    return courseUrls.map(url => {
      const match = url.match(/\/api\/courses\/([^/]+)$/)
      return match ? match[1] : null
    }).filter(Boolean)
  } catch (error) {
    console.error('[SW] Failed to get cached courses:', error)
    return []
  }
}

/**
 * Check if a URL is cached
 */
async function checkCacheStatus(url) {
  if (!url) return { cached: false }

  try {
    const response = await caches.match(url)
    return { cached: !!response }
  } catch (error) {
    return { cached: false }
  }
}

console.log('[SW] Service worker v2 loaded')
