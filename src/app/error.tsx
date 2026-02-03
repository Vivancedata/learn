'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error page component for handling route-level errors
 * Integrates with Sentry for error tracking and provides user feedback options
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Report error to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        error: {
          digest: error.digest,
          name: error.name,
        },
      },
      tags: {
        errorBoundary: 'app-error',
        hasDigest: String(!!error.digest),
      },
    })

    // Store event ID for feedback dialog
    if (typeof window !== 'undefined') {
      (window as unknown as { __sentryEventId?: string }).__sentryEventId = eventId
    }
  }, [error])

  const handleReportFeedback = () => {
    const eventId = (window as unknown as { __sentryEventId?: string }).__sentryEventId
    if (eventId) {
      Sentry.showReportDialog({
        eventId,
        title: 'Something went wrong',
        subtitle: 'Our team has been notified.',
        subtitle2: 'If you would like to help, tell us what happened below.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What were you trying to do?',
        labelClose: 'Close',
        labelSubmit: 'Submit Feedback',
        successMessage: 'Thank you for your feedback!',
      })
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-lg">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6">
            <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
        </div>

        {/* Error ID */}
        {error.digest && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Error ID: <code className="font-mono text-gray-700 dark:text-gray-300">{error.digest}</code>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Our team has been automatically notified
            </p>
          </div>
        )}

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
            <p className="font-semibold text-red-800 dark:text-red-300 mb-2">
              Development Error Details:
            </p>
            <p className="font-mono text-sm text-red-700 dark:text-red-400 break-words">
              {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 text-xs text-red-600 dark:text-red-500 overflow-x-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={reset} size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>

          <Button
            onClick={handleReportFeedback}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Report Issue
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          If this problem persists, please{' '}
          <a
            href="mailto:support@vivancedata.com"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  )
}
