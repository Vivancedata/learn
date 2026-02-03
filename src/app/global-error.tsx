'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface GlobalErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error page for handling errors in the root layout
 * This is a minimal implementation that doesn't rely on any components
 * since those might be the source of the error
 */
export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    // Report critical error to Sentry
    Sentry.captureException(error, {
      contexts: {
        error: {
          digest: error.digest,
          name: error.name,
          type: 'global-error',
        },
      },
      tags: {
        errorBoundary: 'global-error',
        critical: 'true',
      },
      level: 'fatal',
    })
  }, [error])

  return (
    <html>
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f8f9fa',
        color: '#1a1a1a',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: '500px',
        }}>
          {/* Error Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Error Message */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}>
            Critical Error
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}>
            We apologize, but something went seriously wrong. Our team has been notified.
          </p>

          {/* Error ID */}
          {error.digest && (
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
            }}>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0,
              }}>
                Error ID: <code style={{
                  fontFamily: 'monospace',
                  color: '#374151',
                }}>{error.digest}</code>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>
          </div>

          {/* Contact Info */}
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginTop: '32px',
          }}>
            If this problem persists, please contact{' '}
            <a
              href="mailto:support@vivancedata.com"
              style={{ color: '#2563eb' }}
            >
              support@vivancedata.com
            </a>
          </p>
        </div>
      </body>
    </html>
  )
}
