import { ApiError, HTTP_STATUS } from '@/lib/api-errors'

const LOCAL_APP_URL = 'http://localhost:3000'

/**
 * Resolve the external application URL used in emails and payment redirects.
 * In production this must be explicitly configured.
 */
export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (!configuredUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'NEXT_PUBLIC_APP_URL environment variable is required in production.'
      )
    }

    return LOCAL_APP_URL
  }

  const normalizedUrl = configuredUrl.replace(/\/+$/, '')

  try {
    new URL(normalizedUrl)
  } catch {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'NEXT_PUBLIC_APP_URL must be a valid absolute URL.'
    )
  }

  return normalizedUrl
}
