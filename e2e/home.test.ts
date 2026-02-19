import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows workout list with sample workouts', async ({ page }) => {
    await expect(page.getByTestId('new-workout-button')).toBeVisible()
    const workoutCards = await page
      .locator('[data-testid^="workout-card-"]')
      .count()
    expect(workoutCards).toBeGreaterThan(0)
  })

  test.skip('shows empty state when no workouts', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForURL('/')
    await expect(page.getByText('No workouts yet')).toBeVisible()
    await expect(page.getByText('Create your first workout')).toBeVisible()
  })

  test('navigates to new workout page', async ({ page }) => {
    await page.getByTestId('new-workout-button').click()
    await expect(page).toHaveURL('/workouts/new')
    await expect(page.getByTestId('workout-name-input')).toBeVisible()
  })

  test('navigates to edit workout page', async ({ page }) => {
    const editButton = page.getByTestId(/edit-workout-/)
    await editButton.first().click()
    await expect(page).toHaveURL(/\/workouts\/.+\/edit/)
    await expect(page.getByTestId('workout-name-input')).toBeVisible()
  })

  test('starts workout and navigates to timer', async ({ page }) => {
    const startButton = page.getByTestId(/start-workout-/)
    await startButton.first().click()
    await expect(page).toHaveURL('/timer')
    await expect(page.getByTestId('timer-display')).toBeVisible()
  })

  test('deletes workout with confirmation', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept())

    const deleteButton = page.getByTestId(/delete-workout-/)
    const initialCount = await deleteButton.count()

    await deleteButton.first().click()

    await page.waitForTimeout(500)
    const newCount = await deleteButton.count()
    expect(newCount).toBe(initialCount - 1)
  })
})
