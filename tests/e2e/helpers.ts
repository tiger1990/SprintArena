import { Page } from '@playwright/test'

export async function clearAppStorage(page: Page) {
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sprintbrain')) localStorage.removeItem(key)
    })
  })
}

export async function setupWorkspace(page: Page, workspaceName = 'Test Workspace', adminName = 'Test Admin') {
  await page.goto('/signup')
  await page.waitForSelector('[data-testid="workspace-name-input"]', { timeout: 15000 })
  await page.getByTestId('workspace-name-input').fill(workspaceName)
  await page.getByTestId('next-btn').click()
  await page.waitForSelector('[data-testid="admin-name-input"]', { timeout: 10000 })
  await page.getByTestId('admin-name-input').fill(adminName)
  await page.getByTestId('create-workspace-btn').click()
  await page.waitForSelector('[data-testid="go-to-dashboard-btn"]', { timeout: 10000 })
  await page.getByTestId('go-to-dashboard-btn').click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
  // Wait for sidebar to confirm app is fully loaded and hydrated
  await page.waitForSelector('aside', { timeout: 10000 })
}

export async function addTeamMember(page: Page, name: string) {
  await page.goto('/team')
  await page.getByRole('button', { name: /add member/i }).click()
  await page.getByTestId('member-name-input').fill(name)
  await page.getByTestId('confirm-add-member').click()
}

export async function createAndStartSprint(page: Page, name = 'Test Sprint 1') {
  await page.goto('/sprints/new')
  await page.getByTestId('sprint-name-input').fill(name)
  await page.getByTestId('create-start-sprint-btn').click()
  await page.waitForURL('**/board')
}

export async function generateStoriesWithAI(page: Page) {
  await page.goto('/ai-generator')
  await page.getByTestId('feature-input').fill('Build a user authentication system with login and signup')
  await page.getByTestId('generate-btn').click()
  // Wait for stories to appear (mock API is instant)
  await page.waitForSelector('[data-testid="save-all-btn"]', { timeout: 15000 })
  await page.getByTestId('save-all-btn').click()
}
