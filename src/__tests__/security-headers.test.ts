import nextConfig from '../../next.config'

/**
 * Guards the CSP directives whose absence fails silently in the browser.
 *
 * worker-src is the one that already regressed: it was never set, so it fell
 * back to script-src (no blob:), and Sentry's Session Replay -- which
 * compresses in a worker built from a blob URL -- was blocked for every
 * visitor. Nothing failed loudly; replay just quietly stopped compressing.
 */
describe('Content-Security-Policy', () => {
  async function cspDirectives(): Promise<Map<string, string>> {
    const headerGroups = await nextConfig.headers!()
    const csp = headerGroups
      .flatMap((group) => group.headers)
      .find((header) => header.key === 'Content-Security-Policy')

    if (!csp) throw new Error('No Content-Security-Policy header is configured')

    return new Map(
      csp.value.split(';').map((directive) => {
        const [name, ...values] = directive.trim().split(/\s+/)
        return [name, values.join(' ')]
      }),
    )
  }

  it('allows blob: workers so Sentry Session Replay can compress off-thread', async () => {
    const directives = await cspDirectives()

    expect(directives.has('worker-src')).toBe(true)
    expect(directives.get('worker-src')).toContain('blob:')
  })

  it('still allows the jsdelivr-hosted Pyodide runtime', async () => {
    const directives = await cspDirectives()

    expect(directives.get('script-src')).toContain('https://cdn.jsdelivr.net')
    expect(directives.get('connect-src')).toContain('https://cdn.jsdelivr.net')
  })
})
