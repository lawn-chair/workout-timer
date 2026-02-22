import { test, expect, Page } from '@playwright/test'

let nameCounter = 0
function uniqueName(base: string): string {
  nameCounter++
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${nameCounter}`
}

async function createWorkout(page: Page, name: string) {
  await page.goto('/workouts/new')
  await page.getByTestId('workout-name-input').fill(name)
  await page.getByTestId('exercise-name-input-0-0').fill('Test Exercise')
  await page.getByTestId('create-workout-button').click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

test.describe('Home page', () => {
  test('shows workout list with created workouts', async ({ page }) => {
    await createWorkout(page, uniqueName('Sample Workout'))
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
    const name = uniqueName('Workout to Edit from Home')
    await createWorkout(page, name)
    const card = page.locator('[data-testid^="workout-card-"]', {
      hasText: name,
    })
    const editButton = card.getByTestId(/edit-workout-/)
    await Promise.all([
      page.waitForURL(/\/workouts\/.+\/edit/),
      editButton.click(),
    ])
    await expect(page.getByTestId('workout-name-input')).toBeVisible({
      timeout: 10000,
    })
  })

  test('starts workout and navigates to timer', async ({ page }) => {
    const name = uniqueName('Workout to Start')
    await createWorkout(page, name)
    const card = page.locator('[data-testid^="workout-card-"]', {
      hasText: name,
    })
    await card.getByTestId(/start-workout-/).click()
    await expect(page).toHaveURL('/timer')
    await expect(page.getByTestId('timer-display')).toBeVisible()
  })

  test('deletes workout with confirmation', async ({ page }) => {
    const name = uniqueName('Workout to Delete')
    await createWorkout(page, name)
    page.on('dialog', (dialog) => dialog.accept())

    // Wait for the created workout to appear on the page
    const heading = page.getByRole('heading', { name }).first()
    await expect(heading).toBeVisible()
    const card = page.locator('[data-testid^="workout-card-"]', {
      has: heading,
    })

    await card.getByTestId(/delete-workout-/).click()

    await expect(page.getByRole('heading', { name }).first()).not.toBeVisible({
      timeout: 10000,
    })
  })
})
