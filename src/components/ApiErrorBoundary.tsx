'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ErrorBoundary from './ErrorBoundary'

interface ApiErrorFallbackProps {
  error: Error
  onRetry?: () => void
}

/**
 * Fallback UI specifically for API errors
 */
function ApiErrorFallback({ error, onRetry }: ApiErrorFallbackProps) {
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
}

/**
 * Error Boundary specialized for handling API errors
 * Provides user-friendly error messages and retry functionality
 */
export function ApiErrorBoundary({ children, onRetry }: ApiErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <ApiErrorFallback
          error={new Error('API Error')}
          onRetry={onRetry}
        />
      }
      onError={(error, errorInfo) => {
        // Log API errors
        console.error('API Error:', error, errorInfo)

        // In production, send to error tracking service
        // Example: trackApiError(error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ApiErrorBoundary
