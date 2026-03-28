import { test, expect } from '@playwright/test'
import { clearAppStorage } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearAppStorage(page)
  await page.reload()
})

test.describe('Onboarding Flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('shows create workspace link when no users exist', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Create your workspace')).toBeVisible()
  })

  test('complete workspace setup flow', async ({ page }) => {
    await page.goto('/signup')

    // Step 1: Workspace
    await expect(page.getByText('Create your workspace')).toBeVisible()
    await page.getByTestId('workspace-name-input').fill('Acme Engineering')
    await page.getByTestId('next-btn').click()

    // Step 2: Profile
    await expect(page.getByText('Set up your profile')).toBeVisible()
    await page.getByTestId('admin-name-input').fill('Kavishka E.')
    await page.getByTestId('create-workspace-btn').click()

    // Step 3: Success
    await expect(page.getByText("You're all set!")).toBeVisible()
    await page.getByTestId('go-to-dashboard-btn').click()

    // Redirected to dashboard
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  })

  test('workspace name is required', async ({ page }) => {
    await page.goto('/signup')
    await page.getByTestId('next-btn').click()
    // Should still be on step 1 (no navigation happened)
    await expect(page.getByText('Create your workspace')).toBeVisible()
  })

  test('admin name is required', async ({ page }) => {
    await page.goto('/signup')
    await page.getByTestId('workspace-name-input').fill('Test Workspace')
    await page.getByTestId('next-btn').click()
    // create btn should be disabled with empty name
    await expect(page.getByTestId('create-workspace-btn')).toBeDisabled()
  })

  test('sidebar shows after login', async ({ page }) => {
    await page.goto('/signup')
    await page.getByTestId('workspace-name-input').fill('Test WS')
    await page.getByTestId('next-btn').click()
    await page.getByTestId('admin-name-input').fill('Test Admin')
    await page.getByTestId('create-workspace-btn').click()
    await page.getByTestId('go-to-dashboard-btn').click()

    await expect(page.locator('aside').getByText('SprintBrain')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'AI Backlog' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Kanban Board' })).toBeVisible()
  })
})
