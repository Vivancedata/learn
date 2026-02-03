/**
 * Deep Link Handler for VivanceData
 *
 * Handles deep links into the app from:
 * - Custom URL scheme: vivancedata://
 * - Universal Links (iOS): https://vivancedata.com/...
 * - App Links (Android): https://vivancedata.com/...
 *
 * Supported Deep Link Patterns:
 * - vivancedata://course/{courseId}
 * - vivancedata://lesson/{courseId}/{lessonId}
 * - vivancedata://path/{pathId}
 * - vivancedata://assessment/{assessmentId}
 * - vivancedata://leaderboard
 * - vivancedata://profile
 * - vivancedata://settings
 * - vivancedata://search?q={query}
 */

// ============================================================================
// Types
// ============================================================================

export type DeepLinkRoute =
  | { type: 'course'; courseId: string }
  | { type: 'lesson'; courseId: string; lessonId: string }
  | { type: 'path'; pathId: string }
  | { type: 'assessment'; assessmentId: string }
  | { type: 'leaderboard' }
  | { type: 'profile'; userId?: string }
  | { type: 'settings' }
  | { type: 'search'; query: string }
  | { type: 'home' }
  | { type: 'unknown'; url: string }

export interface DeepLinkParseResult {
  /** The parsed route */
  route: DeepLinkRoute
  /** The original URL */
  originalUrl: string
  /** Whether the URL was valid */
  isValid: boolean
  /** Navigation path for Next.js router */
  navigationPath: string
}

// ============================================================================
// Constants
// ============================================================================

/** Custom URL scheme for the app */
export const URL_SCHEME = 'vivancedata'

/** Production domain for universal/app links */
export const PRODUCTION_DOMAIN = 'vivancedata.com'

/** Valid deep link routes */
const VALID_ROUTES = ['course', 'lesson', 'path', 'assessment', 'leaderboard', 'profile', 'settings', 'search'] as const

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Parse a deep link URL into a route object
 * @param url - The deep link URL to parse
 * @returns Parsed deep link result
 */
export function parseDeepLink(url: string): DeepLinkParseResult {
  const result: DeepLinkParseResult = {
    route: { type: 'unknown', url },
    originalUrl: url,
    isValid: false,
    navigationPath: '/',
  }

  try {
    // Handle custom scheme: vivancedata://...
    // Handle universal links: https://vivancedata.com/...
    const normalizedUrl = normalizeDeepLinkUrl(url)
    if (!normalizedUrl) {
      return result
    }

    const parsedUrl = new URL(normalizedUrl)
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean)
    const searchParams = parsedUrl.searchParams

    // Empty path or home
    if (pathParts.length === 0) {
      result.route = { type: 'home' }
      result.navigationPath = '/'
      result.isValid = true
      return result
    }

    const routeType = pathParts[0].toLowerCase()

    switch (routeType) {
      case 'course': {
        if (pathParts.length >= 2) {
          const courseId = pathParts[1]
          result.route = { type: 'course', courseId }
          result.navigationPath = `/courses/${courseId}`
          result.isValid = true
        }
        break
      }

      case 'lesson': {
        if (pathParts.length >= 3) {
          const courseId = pathParts[1]
          const lessonId = pathParts[2]
          result.route = { type: 'lesson', courseId, lessonId }
          result.navigationPath = `/courses/${courseId}/lessons/${lessonId}`
          result.isValid = true
        }
        break
      }

      case 'path': {
        if (pathParts.length >= 2) {
          const pathId = pathParts[1]
          result.route = { type: 'path', pathId }
          result.navigationPath = `/paths/${pathId}`
          result.isValid = true
        }
        break
      }

      case 'assessment': {
        if (pathParts.length >= 2) {
          const assessmentId = pathParts[1]
          result.route = { type: 'assessment', assessmentId }
          result.navigationPath = `/assessments/${assessmentId}`
          result.isValid = true
        }
        break
      }

      case 'leaderboard': {
        result.route = { type: 'leaderboard' }
        result.navigationPath = '/leaderboard'
        result.isValid = true
        break
      }

      case 'profile': {
        const userId = pathParts[1]
        result.route = { type: 'profile', userId }
        result.navigationPath = userId ? `/profile/${userId}` : '/profile'
        result.isValid = true
        break
      }

      case 'settings': {
        result.route = { type: 'settings' }
        result.navigationPath = '/settings'
        result.isValid = true
        break
      }

      case 'search': {
        const query = searchParams.get('q') || ''
        result.route = { type: 'search', query }
        result.navigationPath = query ? `/search?q=${encodeURIComponent(query)}` : '/search'
        result.isValid = true
        break
      }

      // Handle direct paths (e.g., /courses/python-data-science)
      case 'courses': {
        if (pathParts.length >= 2) {
          const courseId = pathParts[1]
          if (pathParts.length >= 4 && pathParts[2] === 'lessons') {
            const lessonId = pathParts[3]
            result.route = { type: 'lesson', courseId, lessonId }
            result.navigationPath = `/courses/${courseId}/lessons/${lessonId}`
          } else {
            result.route = { type: 'course', courseId }
            result.navigationPath = `/courses/${courseId}`
          }
          result.isValid = true
        }
        break
      }

      case 'paths': {
        if (pathParts.length >= 2) {
          const pathId = pathParts[1]
          result.route = { type: 'path', pathId }
          result.navigationPath = `/paths/${pathId}`
          result.isValid = true
        }
        break
      }

      case 'assessments': {
        if (pathParts.length >= 2) {
          const assessmentId = pathParts[1]
          result.route = { type: 'assessment', assessmentId }
          result.navigationPath = `/assessments/${assessmentId}`
          result.isValid = true
        }
        break
      }
    }
  } catch (error) {
    console.warn('Failed to parse deep link:', error)
  }

  return result
}

/**
 * Normalize a deep link URL to a standard format
 * Converts custom scheme URLs to https URLs for easier parsing
 */
function normalizeDeepLinkUrl(url: string): string | null {
  if (!url) return null

  // Already a valid http(s) URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Custom scheme: vivancedata://path/to/resource
  if (url.startsWith(`${URL_SCHEME}://`)) {
    const path = url.replace(`${URL_SCHEME}://`, '')
    return `https://${PRODUCTION_DOMAIN}/${path}`
  }

  // Just a path: /course/python
  if (url.startsWith('/')) {
    return `https://${PRODUCTION_DOMAIN}${url}`
  }

  // Bare path: course/python
  return `https://${PRODUCTION_DOMAIN}/${url}`
}

// ============================================================================
// URL Generation
// ============================================================================

/**
 * Generate a deep link URL for a given route
 * @param route - The route to generate a URL for
 * @param useCustomScheme - Whether to use the custom URL scheme (default: true)
 * @returns The deep link URL
 */
export function generateDeepLink(route: DeepLinkRoute, useCustomScheme: boolean = true): string {
  const scheme = useCustomScheme ? `${URL_SCHEME}://` : `https://${PRODUCTION_DOMAIN}/`

  switch (route.type) {
    case 'course':
      return `${scheme}course/${route.courseId}`

    case 'lesson':
      return `${scheme}lesson/${route.courseId}/${route.lessonId}`

    case 'path':
      return `${scheme}path/${route.pathId}`

    case 'assessment':
      return `${scheme}assessment/${route.assessmentId}`

    case 'leaderboard':
      return `${scheme}leaderboard`

    case 'profile':
      return route.userId ? `${scheme}profile/${route.userId}` : `${scheme}profile`

    case 'settings':
      return `${scheme}settings`

    case 'search':
      return `${scheme}search?q=${encodeURIComponent(route.query)}`

    case 'home':
      return scheme

    case 'unknown':
      return route.url
  }
}

/**
 * Generate a shareable link for a course
 */
export function generateCourseLink(courseId: string, useUniversalLink: boolean = true): string {
  return generateDeepLink({ type: 'course', courseId }, !useUniversalLink)
}

/**
 * Generate a shareable link for a lesson
 */
export function generateLessonLink(
  courseId: string,
  lessonId: string,
  useUniversalLink: boolean = true
): string {
  return generateDeepLink({ type: 'lesson', courseId, lessonId }, !useUniversalLink)
}

/**
 * Generate a shareable link for a learning path
 */
export function generatePathLink(pathId: string, useUniversalLink: boolean = true): string {
  return generateDeepLink({ type: 'path', pathId }, !useUniversalLink)
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Check if a URL is a valid VivanceData deep link
 */
export function isValidDeepLink(url: string): boolean {
  const result = parseDeepLink(url)
  return result.isValid
}

/**
 * Check if a URL is a custom scheme deep link
 */
export function isCustomSchemeLink(url: string): boolean {
  return url.startsWith(`${URL_SCHEME}://`)
}

/**
 * Check if a URL is a universal/app link
 */
export function isUniversalLink(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname === PRODUCTION_DOMAIN || parsedUrl.hostname.endsWith(`.${PRODUCTION_DOMAIN}`)
  } catch {
    return false
  }
}

// ============================================================================
// Deep Link Handler
// ============================================================================

export type DeepLinkHandler = (result: DeepLinkParseResult) => void

let deepLinkHandlers: DeepLinkHandler[] = []

/**
 * Register a handler for deep links
 * @returns Cleanup function to remove the handler
 */
export function registerDeepLinkHandler(handler: DeepLinkHandler): () => void {
  deepLinkHandlers.push(handler)

  return () => {
    deepLinkHandlers = deepLinkHandlers.filter(h => h !== handler)
  }
}

/**
 * Handle an incoming deep link URL
 * Parses the URL and notifies all registered handlers
 */
export function handleDeepLink(url: string): DeepLinkParseResult {
  const result = parseDeepLink(url)

  // Notify all registered handlers
  deepLinkHandlers.forEach(handler => {
    try {
      handler(result)
    } catch (error) {
      console.error('Deep link handler error:', error)
    }
  })

  return result
}

// ============================================================================
// App Link Configuration (for documentation)
// ============================================================================

/**
 * iOS Universal Links configuration
 * Add this to your Apple App Site Association file at:
 * https://vivancedata.com/.well-known/apple-app-site-association
 */
export const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'TEAM_ID.com.vivancedata.learn',
        paths: [
          '/course/*',
          '/courses/*',
          '/lesson/*',
          '/path/*',
          '/paths/*',
          '/assessment/*',
          '/assessments/*',
          '/leaderboard',
          '/profile',
          '/profile/*',
          '/settings',
          '/search',
        ],
      },
    ],
  },
}

/**
 * Android App Links configuration
 * Add this to your assetlinks.json file at:
 * https://vivancedata.com/.well-known/assetlinks.json
 */
export const androidAssetLinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.vivancedata.learn',
      sha256_cert_fingerprints: [
        // Add your app signing certificate fingerprint here
        'SHA256_FINGERPRINT',
      ],
    },
  },
]
