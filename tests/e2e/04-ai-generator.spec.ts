import { test, expect } from '@playwright/test'
import { clearAppStorage, setupWorkspace, createAndStartSprint } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearAppStorage(page)
  await page.reload()
  await setupWorkspace(page)
})

test.describe('AI Backlog Generator', () => {
  test('shows generator form', async ({ page }) => {
    await page.goto('/ai-generator')
    await expect(page.getByText('AI Backlog Generator')).toBeVisible()
    await expect(page.getByTestId('feature-input')).toBeVisible()
    await expect(page.getByTestId('generate-btn')).toBeVisible()
  })

  test('generate button is disabled when input is empty', async ({ page }) => {
    await page.goto('/ai-generator')
    await expect(page.getByTestId('generate-btn')).toBeDisabled()
  })

  test('generate button enables when input has text', async ({ page }) => {
    await page.goto('/ai-generator')
    await page.getByTestId('feature-input').fill('Build authentication system')
    await expect(page.getByTestId('generate-btn')).toBeEnabled()
  })

  test('example prompt chips fill the input', async ({ page }) => {
    await page.goto('/ai-generator')
    await page.getByText('User authentication with OAuth and 2FA support').click()
    const value = await page.getByTestId('feature-input').inputValue()
    expect(value).toContain('authentication')
  })

  test('generates stories and shows results', async ({ page }) => {
    await page.goto('/ai-generator')
    await page.getByTestId('feature-input').fill('Build user authentication')
    await page.getByTestId('generate-btn').click()

    // Wait for save button (stories loaded)
    await expect(page.getByTestId('save-all-btn')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Generated User Stories')).toBeVisible()
  })

  test('saves stories to backlog for admin', async ({ page }) => {
    await page.goto('/ai-generator')
    await page.getByTestId('feature-input').fill('Payment processing feature')
    await page.getByTestId('generate-btn').click()
    await page.getByTestId('save-all-btn').click({ timeout: 15000 })

    await expect(page.getByText('Saved to Workspace')).toBeVisible()
    // Navigate to backlog and verify
    await page.goto('/backlog')
    await expect(page.locator('.bg-\\[\\#13192a\\]').first()).toBeVisible()
  })

  test('adds stories to active sprint when sprint exists', async ({ page }) => {
    await createAndStartSprint(page)
    await page.goto('/ai-generator')
    await page.getByTestId('feature-input').fill('Authentication system')
    await page.getByTestId('generate-btn').click()
    await page.waitForSelector('[data-testid="save-all-btn"]', { timeout: 15000 })

    // Button should say "Add to Sprint" when sprint is active
    await expect(page.getByTestId('save-all-btn')).toContainText('Add to Sprint')
    await page.getByTestId('save-all-btn').click()

    // Stories should appear on board
    await page.goto('/board')
    const cards = page.locator('.kanban-column .bg-\\[\\#1a1f2e\\]')
    await expect(cards.first()).toBeVisible()
  })
})
