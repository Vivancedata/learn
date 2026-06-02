/**
 * Vendored UI primitives (formerly the `@vivancedata/ui` package).
 *
 * These components were vendored into the app so builds are fully reproducible
 * and don't depend on a GitHub tarball. The public surface mirrors what the
 * `src/components/ui/*` wrappers re-export. Internal-only primitives (e.g.
 * dropdown-menu, used by theme-toggle) are intentionally not re-exported here.
 */

export * from './components/button'
export * from './components/card'
export * from './components/badge'
export * from './components/input'
export * from './components/textarea'
export * from './components/label'
export * from './components/alert'
export * from './components/avatar'
export * from './components/progress'
export * from './components/progress-circle'
export * from './components/spinner'
export * from './components/status-badge'
export * from './components/theme-provider'
export * from './components/theme-toggle'
export * from './components/scroll-area'
