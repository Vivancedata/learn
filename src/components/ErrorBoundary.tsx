'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  eventId: string | null
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * Logs those errors and displays a fallback UI instead of the component tree that crashed
 * Integrates with Sentry for error tracking in production
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      eventId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Report to Sentry with React-specific context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: 'ErrorBoundary',
        component: 'global',
      },
    })

    // Store the event ID for user feedback
    this.setState({ eventId })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      eventId: null,
    })
  }

  handleReportFeedback = () => {
    if (this.state.eventId) {
      // Open Sentry feedback dialog
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        title: 'It looks like we had an error.',
        subtitle: 'Our team has been notified.',
        subtitle2: 'If you would like to help, tell us what happened below.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelComments: 'What happened?',
        labelClose: 'Close',
        labelSubmit: 'Submit',
        successMessage: 'Your feedback has been sent. Thank you!',
      })
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h2>

            <p className="text-muted-foreground">
              We encountered an unexpected error. Please try again or contact
              support if the problem persists.
            </p>

            {this.state.eventId && (
              <p className="text-sm text-muted-foreground font-mono">
                Error ID: {this.state.eventId}
              </p>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <p className="font-mono text-sm text-destructive break-words">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>

              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
              >
                Go Home
              </Button>

              {this.state.eventId && (
                <Button
                  onClick={this.handleReportFeedback}
                  variant="outline"
                >
                  Report Issue
                </Button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
