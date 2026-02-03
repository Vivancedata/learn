'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ErrorBoundary from './ErrorBoundary'

interface ApiErrorFallbackProps {
  error: Error
  onRetry?: () => void
  eventId?: string | null
}

/**
 * Fallback UI specifically for API errors
 */
function ApiErrorFallback({ error, onRetry, eventId }: ApiErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') ||
                         error.message.includes('network') ||
                         error.message.includes('Failed to fetch')

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 p-4">
            <AlertCircle className="h-10 w-10 text-amber-600" />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-900">
          {isNetworkError ? 'Connection Error' : 'Unable to Load Data'}
        </h3>

        <p className="text-gray-600">
          {isNetworkError
            ? 'Unable to connect to the server. Please check your internet connection and try again.'
            : 'We had trouble loading this content. This might be a temporary issue.'}
        </p>

        {eventId && (
          <p className="text-sm text-gray-500 font-mono">
            Error ID: {eventId}
          </p>
        )}

        {onRetry && (
          <Button onClick={onRetry} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}

interface ApiErrorBoundaryProps {
  children: React.ReactNode
  onRetry?: () => void
  /** Optional context identifier for error tracking */
  context?: string
}

interface ApiErrorBoundaryState {
  eventId: string | null
  error: Error | null
}

/**
 * Error Boundary specialized for handling API errors
 * Provides user-friendly error messages and retry functionality
 * Integrates with Sentry for error tracking
 */
class ApiErrorBoundaryClass extends React.Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props)
    this.state = {
      eventId: null,
      error: null,
    }
  }

  render() {
    return (
      <ErrorBoundary
        fallback={
          <ApiErrorFallback
            error={this.state.error || new Error('API Error')}
            onRetry={this.props.onRetry}
            eventId={this.state.eventId}
          />
        }
        onError={(error, errorInfo) => {
          // Determine if this is an API-related error
          const isApiError = error.message.includes('fetch') ||
                            error.message.includes('API') ||
                            error.message.includes('network') ||
                            error.message.includes('request')

          // Report to Sentry with API-specific context
          const eventId = Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
              api: {
                context: this.props.context || 'unknown',
                isNetworkError: error.message.includes('fetch') || error.message.includes('network'),
              },
            },
            tags: {
              errorBoundary: 'ApiErrorBoundary',
              errorType: isApiError ? 'api' : 'runtime',
              context: this.props.context || 'unknown',
            },
            level: isApiError ? 'warning' : 'error',
          })

          // Store the event ID and error for display
          this.setState({ eventId, error })

          // Add breadcrumb for debugging
          Sentry.addBreadcrumb({
            category: 'api',
            message: `API Error caught in ${this.props.context || 'ApiErrorBoundary'}`,
            level: 'error',
            data: {
              errorMessage: error.message,
              componentStack: errorInfo.componentStack?.substring(0, 500),
            },
          })
        }}
      >
        {this.props.children}
      </ErrorBoundary>
    )
  }
}

/**
 * Functional wrapper for ApiErrorBoundary
 */
export function ApiErrorBoundary({ children, onRetry, context }: ApiErrorBoundaryProps) {
  return (
    <ApiErrorBoundaryClass onRetry={onRetry} context={context}>
      {children}
    </ApiErrorBoundaryClass>
  )
}

export default ApiErrorBoundary
