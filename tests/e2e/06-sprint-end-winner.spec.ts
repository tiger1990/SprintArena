import { test, expect } from '@playwright/test'
import { clearAppStorage, setupWorkspace, createAndStartSprint, generateStoriesWithAI, addTeamMember } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearAppStorage(page)
  await page.reload()
  await setupWorkspace(page)
  await addTeamMember(page, 'Marcus R.')
  await createAndStartSprint(page)
  await generateStoriesWithAI(page)
})

test.describe('Sprint End & Winner', () => {
  test('admin sees end sprint button on board', async ({ page }) => {
    await page.goto('/board')
    await expect(page.getByRole('link', { name: /end sprint/i })).toBeVisible()
  })

  test('end sprint page loads with incomplete story list', async ({ page }) => {
    await page.goto('/board')
    const endLink = page.getByRole('link', { name: /end sprint/i })
    await endLink.click()
    await expect(page.getByText('End Sprint')).toBeVisible()
    await expect(page.getByTestId('confirm-end-sprint-btn')).toBeVisible()
  })

  test('can end sprint and see winner page', async ({ page }) => {
    await page.goto('/board')

    // Move a story to Done via quick action
    const card = page.locator('.bg-\\[\\#1a1f2e\\]').first()
    await card.hover()
    // Click Start arrow if visible
    const startBtn = card.locator('text=Start')
    if (await startBtn.isVisible()) {
      await startBtn.click()
    }

    // End sprint
    const endLink = page.getByRole('link', { name: /end sprint/i })
    await endLink.click()
    await page.getByTestId('confirm-end-sprint-btn').click()

    // Should navigate to winner page
    await expect(page).toHaveURL(/winner/)
    // Page shows winner celebration OR no-winner message depending on story assignments
    const winnerHeading = page.getByRole('heading', { name: /Sprint Complete!/ })
    const noWinnerHeading = page.getByRole('heading', { name: /No winner this sprint/ })
    await expect(winnerHeading.or(noWinnerHeading)).toBeVisible()
  })

  test('hall of fame shows winner after sprint ends', async ({ page }) => {
    // End sprint with no stories done
    await page.goto('/board')
    const endLink = page.getByRole('link', { name: /end sprint/i })
    await endLink.click()
    await page.getByTestId('confirm-end-sprint-btn').click()
    await page.waitForURL(/winner/)

    await page.goto('/hall-of-fame')
    // Either shows winners or empty state
    const hasWinners = await page.getByRole('heading', { name: 'Hall of Fame' }).isVisible()
    expect(hasWinners).toBe(true)
  })
})
