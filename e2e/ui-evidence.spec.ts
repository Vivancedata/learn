import { expect, test } from '@playwright/test'

// Same DB-free pages the Lighthouse job already serves from a production build.
const pages = [
  { path: '/pricing', heading: 'Invest in Your Future' },
  { path: '/sign-in', heading: null },
]

for (const { path, heading } of pages) {
  test(`renders ${path}`, async ({ page }, testInfo) => {
    const response = await page.goto(path)
    expect(response?.ok()).toBe(true)
    if (heading) await expect(page.locator('h1')).toContainText(heading)
    else await expect(page.locator('form')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`${path.slice(1)}.png`), fullPage: true })
  })
}
