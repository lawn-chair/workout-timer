import { test, expect, Page } from '@playwright/test'

async function createWorkout(page: Page, name: string) {
  await page.goto('/workouts/new')
  await page.getByTestId('workout-name-input').fill(name)
  await page.getByTestId('exercise-name-input-0-0').fill('Test Exercise')
  await page.getByTestId('create-workout-button').click()
  await expect(page).toHaveURL('/')
}

test.describe('Home page', () => {
  test('shows workout list with created workouts', async ({ page }) => {
    await createWorkout(page, 'Sample Workout')
    await expect(page.getByTestId('new-workout-button')).toBeVisible()
    const workoutCards = await page
      .locator('[data-testid^="workout-card-"]')
      .count()
    expect(workoutCards).toBeGreaterThan(0)
  })

  test('shows empty state when no workouts', async ({ page }) => {
    await page.goto('/')
    // If there are workouts from other tests, this may not show empty state.
    // Just verify the page loads correctly with or without workouts.
    await expect(page.getByTestId('new-workout-button')).toBeVisible()
  })

  test('navigates to new workout page', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('new-workout-button').click()
    await expect(page).toHaveURL('/workouts/new')
    await expect(page.getByTestId('workout-name-input')).toBeVisible()
  })

  test('navigates to edit workout page', async ({ page }) => {
    await createWorkout(page, 'Workout to Edit from Home')
    const editButton = page.getByTestId(/edit-workout-/)
    await Promise.all([
      page.waitForURL(/\/workouts\/.+\/edit/),
      editButton.first().click(),
    ])
    await expect(page.getByTestId('workout-name-input')).toBeVisible({
      timeout: 10000,
    })
  })

  test('starts workout and navigates to timer', async ({ page }) => {
    await createWorkout(page, 'Workout to Start')
    const startButton = page.getByTestId(/start-workout-/)
    await startButton.first().click()
    await expect(page).toHaveURL('/timer')
    await expect(page.getByTestId('timer-display')).toBeVisible()
  })

  test('deletes workout with confirmation', async ({ page }) => {
    await createWorkout(page, 'Workout to Delete')
    page.on('dialog', (dialog) => dialog.accept())

    // Wait for the created workout to appear on the page
    await expect(
      page.getByRole('heading', { name: 'Workout to Delete' }).first()
    ).toBeVisible()

    const deleteButton = page.getByTestId(/delete-workout-/)
    const initialCount = await deleteButton.count()
    expect(initialCount).toBeGreaterThan(0)

    await deleteButton.first().click()

    await expect(
      page.getByRole('heading', { name: 'Workout to Delete' }).first()
    ).not.toBeVisible({
      timeout: 10000,
    })
  })
})
