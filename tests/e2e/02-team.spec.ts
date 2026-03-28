import { test, expect } from '@playwright/test'
import { clearAppStorage, setupWorkspace } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearAppStorage(page)
  await page.reload()
  await setupWorkspace(page)
})

test.describe('Team Management', () => {
  test('admin can view team page', async ({ page }) => {
    await page.goto('/team')
    await expect(page.getByRole('heading', { name: 'Team' })).toBeVisible()
    await expect(page.getByText(/\d+ members/)).toBeVisible()
  })

  test('invite code is displayed', async ({ page }) => {
    await page.goto('/team')
    await expect(page.getByText('Invite code')).toBeVisible()
    // 6-char code should be visible
    const codeEl = page.locator('.tracking-widest')
    await expect(codeEl).toBeVisible()
    const code = await codeEl.textContent()
    expect(code?.length).toBe(6)
  })

  test('admin can add team member', async ({ page }) => {
    await page.goto('/team')
    await page.getByRole('button', { name: /add member/i }).click()
    await page.getByTestId('member-name-input').fill('Marcus R.')
    await page.getByTestId('confirm-add-member').click()
    await expect(page.getByText('Marcus R.')).toBeVisible()
    await expect(page.getByText('2 members')).toBeVisible()
  })

  test('copy invite code button works', async ({ page }) => {
    await page.goto('/team')
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: /copy code/i }).click()
    // Toast should appear
    await expect(page.getByText('Invite code copied!')).toBeVisible()
  })

  test('member joins via invite link', async ({ page }) => {
    await page.goto('/team')
    const codeEl = page.locator('.tracking-widest').first()
    const code = await codeEl.textContent()

    await page.goto(`/join/${code}`)
    await expect(page.getByText("You're joining")).toBeVisible()
    await page.getByTestId('member-name-input').fill('Jamie L.')
    await page.getByTestId('join-workspace-btn').click()
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
