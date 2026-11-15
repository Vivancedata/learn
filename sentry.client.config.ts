/**
 * Sentry browser setup. The SDK and its options live in src/lib/sentry-client.ts
 * and are loaded once the browser is idle, keeping them out of the first load.
 */
import { loadSentry } from '@/lib/sentry-client'

const scheduleIdle =
  window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1))
scheduleIdle(() => {
  void loadSentry()
})
