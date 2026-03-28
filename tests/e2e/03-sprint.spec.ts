import { test, expect } from '@playwright/test'
import { clearAppStorage, setupWorkspace } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearAppStorage(page)
  await page.reload()
  await setupWorkspace(page)
})

test.describe('Sprint Management', () => {
  test('admin can create a sprint in planning mode', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Sprint Alpha')
    await page.getByTestId('create-sprint-btn').click()
    await expect(page).toHaveURL(/backlog/)
  })

  test('admin can create and start a sprint', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Sprint Beta')
    await page.getByTestId('create-start-sprint-btn').click()
    await expect(page).toHaveURL(/board/)
    await expect(page.getByText('Active Sprint Board')).toBeVisible()
  })

  test('board shows 4 columns when sprint is active', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Sprint 1')
    await page.getByTestId('create-start-sprint-btn').click()

    await expect(page.getByText('To Do')).toBeVisible()
    await expect(page.getByText('In Progress')).toBeVisible()
    await expect(page.getByText('Review')).toBeVisible()
    await expect(page.getByText('Done', { exact: true })).toBeVisible()
  })

  test('board shows empty sprint header with sprint name', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Sprint Gamma')
    await page.getByTestId('create-start-sprint-btn').click()
    await expect(page.getByText('Active Sprint Board')).toBeVisible()
  })

  test('sprint name is required to create', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').clear()
    await expect(page.getByTestId('create-sprint-btn')).toBeDisabled()
    await expect(page.getByTestId('create-start-sprint-btn')).toBeDisabled()
  })

  test('dashboard shows sprint progress when active', async ({ page }) => {
    await page.goto('/sprints/new')
    await page.getByTestId('sprint-name-input').fill('Test Sprint')
    await page.getByTestId('create-start-sprint-btn').click()
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Test Sprint' })).toBeVisible()
  })
})
