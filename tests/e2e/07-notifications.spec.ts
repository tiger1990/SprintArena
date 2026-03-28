import { test, expect } from '@playwright/test'
import { clearAppStorage, setupWorkspace } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearAppStorage(page)
  await page.reload()
  await setupWorkspace(page)
})

test.describe('Notifications', () => {
  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
  })

  test('empty state shows when no notifications', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByText('All caught up!')).toBeVisible()
  })

  test('sprint start creates a notification', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Notif Test Sprint')
    await page.getByTestId('create-start-sprint-btn').click()
    await page.waitForURL(/board/)

    await page.goto('/notifications')
    await expect(page.getByText(/has started/)).toBeVisible()
  })

  test('bell icon shows unread count', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Notif Sprint')
    await page.getByTestId('create-start-sprint-btn').click()
    await page.goto('/dashboard')

    // Unread badge should be visible in nav
    const badge = page.locator('nav .bg-indigo-500').first()
    await expect(badge).toBeVisible()
  })
})
