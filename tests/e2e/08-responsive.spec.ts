import { test, expect } from '@playwright/test'
import { clearAppStorage, setupWorkspace } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearAppStorage(page)
  await page.reload()
  await setupWorkspace(page)
})

test.describe('Responsive Design', () => {
  test('mobile bottom nav is visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    // Mobile nav should be visible
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible()
  })

  test('desktop sidebar is hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    // Sidebar should be hidden (md:flex)
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeHidden()
  })

  test('desktop sidebar visible on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard')
    await expect(page.locator('aside')).toBeVisible()
  })

  test('signup page works on mobile', async ({ page }) => {
    await clearAppStorage(page)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/signup')
    await expect(page.getByText('Create your workspace')).toBeVisible()
    await page.getByTestId('workspace-name-input').fill('Mobile Workspace')
    await page.getByTestId('next-btn').click()
    await expect(page.getByText('Set up your profile')).toBeVisible()
  })

  test('board is horizontally scrollable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Mobile Sprint')
    await page.getByTestId('create-start-sprint-btn').click()
    await expect(page.getByText('Active Sprint Board')).toBeVisible()
    // Columns container should be scrollable
    const boardContainer = page.locator('.overflow-x-auto')
    await expect(boardContainer).toBeVisible()
  })
})
