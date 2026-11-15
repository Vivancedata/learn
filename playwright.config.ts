import { defineConfig, devices } from '@playwright/test'

// UI evidence run: screenshots + trace of key pages on every run, uploaded by CI
// as the `ui-evidence` artifact. Needs a prior `npm run build`; no DB or secrets.
const PORT = Number(process.env.PORT ?? 3100)

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  reporter: [['list'], ['json', { outputFile: 'reports/ui.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    screenshot: 'on',
    trace: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/pricing`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
