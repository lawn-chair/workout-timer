import { test, expect } from '@playwright/test'

test.describe('PWA basics', () => {
  test('serves manifest link', async ({ page }) => {
    await page.goto('/')

    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest')
  })

  test('shows offline fallback when navigation fails', async ({ page }) => {
    await page.goto('/offline')
    await expect(page.getByText('Connection paused')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Back to dashboard' })
    ).toBeVisible()
  })
})
