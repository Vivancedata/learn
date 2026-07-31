import type { NextConfig } from 'next'
import path from 'node:path'
import { createRequire } from 'node:module'
import { withSentryConfig } from '@sentry/nextjs'

/**
 * Turbopack refuses to compile files outside its root, so the root has to
 * contain the resolved `next` package. In the npm workspace `next` is hoisted
 * to the repo root; in a standalone deploy it sits in this project. Deriving
 * the root from where `next` actually resolves is correct in both cases --
 * process.cwd() only works standalone.
 */
const turbopackRoot = path.resolve(
  path.dirname(createRequire(import.meta.url).resolve('next/package.json')),
  '..',
  '..'
)

/**
 * Determine if we're building for mobile (Capacitor)
 * Set CAPACITOR_BUILD=true when running npm run build:mobile
 */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true'

const nextConfig: NextConfig = {
  turbopack: {
    root: turbopackRoot,
  },

  // @vivancedata/ui ships TypeScript source from its `exports.import` entry, so
  // Next has to compile it rather than treat it as a prebuilt dependency.
  transpilePackages: ['@vivancedata/ui'],

  /**
   * Static export configuration for Capacitor builds
   * When building for mobile, we export as static HTML/JS/CSS
   * that can be loaded in the native WebView
   */
  ...(isCapacitorBuild && {
    output: 'export',
    // Disable image optimization for static export
    images: {
      unoptimized: true,
    },
    // Trailing slashes help with static file serving
    trailingSlash: true,
  }),

  async headers() {
    return [
      {
        // Apply CSP headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net", // unsafe-inline needed for Next.js; jsdelivr serves the Pyodide (in-browser Python) runtime
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io https://cdn.jsdelivr.net", // Sentry + Pyodide CDN (wasm/package assets)
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Organization and project settings (from environment variables)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Hide source maps from being available in production
  hideSourceMaps: true,

  // Route browser requests to Sentry through a proxy route
  // This helps with ad blockers and improves reliability
  tunnelRoute: '/monitoring',

  // Opt out of sending telemetry data to Sentry
  telemetry: false,

  // Bundler-related Sentry options
  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,
  },
}

// Wrap the Next.js config with Sentry
// Only enable Sentry webpack plugin if we have the required environment variables
const config = process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig

export default config
