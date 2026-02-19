import { test, expect } from '@playwright/test'

test.describe('Edit Workout page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workouts/new')
    await page.getByTestId('workout-name-input').fill('Workout to Edit')
    await page.getByTestId('exercise-name-input-0').fill('Burpees')
    await page.getByTestId('create-workout-button').click()
  })

  test('loads existing workout data', async ({ page }) => {
    await page.goto('/')
    const editButton = page.getByTestId(/edit-workout-/)
    await editButton.first().click()

    await expect(page.getByTestId('workout-name-input')).toHaveValue(
      'Workout to Edit'
    )
    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Burpees'
    )
  })

  test('updates workout name', async ({ page }) => {
    await page.goto('/')
    const editButton = page.getByTestId(/edit-workout-/)
    await editButton.first().click()

    await page.getByTestId('workout-name-input').fill('Updated Workout Name')
    await page.getByTestId('update-workout-button').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Updated Workout Name')).toBeVisible()
  })

  test('adds new exercise when editing', async ({ page }) => {
    await page.goto('/')
    const editButton = page.getByTestId(/edit-workout-/)
    await editButton.first().click()

    await page.getByTestId('add-exercise-button').click()
    await page.getByTestId('exercise-name-input-1').fill('Planks')
    await page.getByTestId('update-workout-button').click()

    await page.goto('/')
    await page
      .getByTestId(/edit-workout-/)
      .first()
      .click()

    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Burpees'
    )
    await expect(page.getByTestId('exercise-name-input-1')).toHaveValue(
      'Planks'
    )
  })

  test('removes exercise when editing', async ({ page }) => {
    await page.goto('/workouts/new')
    await page.getByTestId('workout-name-input').fill('Multi Exercise Edit')
    await page.getByTestId('exercise-name-input-0').fill('Push-ups')
    await page.getByTestId('add-exercise-button').click()
    await page.getByTestId('exercise-name-input-1').fill('Squats')
    await page.getByTestId('create-workout-button').click()

    await expect(page.getByText('Multi Exercise Edit')).toBeVisible()

    await page.goto('/')
    await expect(page.getByText('Multi Exercise Edit')).toBeVisible()

    const workoutCard = page.locator('[data-testid^="workout-card-"]', {
      hasText: 'Multi Exercise Edit',
    })
    const editLink = workoutCard.locator('a', { hasText: 'Edit' })
    await editLink.click()

    await expect(page.getByTestId('workout-name-input')).toHaveValue(
      'Multi Exercise Edit'
    )
    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Push-ups'
    )
    await expect(page.getByTestId('exercise-name-input-1')).toHaveValue(
      'Squats'
    )

    await page.getByTestId('remove-exercise-button-1').click()
    await page.getByTestId('update-workout-button').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Multi Exercise Edit')).toBeVisible()

    await page.goto('/')
    const editedCard = page.locator('[data-testid^="workout-card-"]', {
      hasText: 'Multi Exercise Edit',
    })
    const editedLink = editedCard.locator('a', { hasText: 'Edit' })
    await editedLink.click()

    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Push-ups'
    )
    await expect(page.getByTestId('exercise-name-input-1')).not.toBeVisible()
  })

  test('cancels edit and returns to home', async ({ page }) => {
    await page.goto('/')
    const editButton = page.getByTestId(/edit-workout-/)
    await editButton.first().click()

    await page.getByTestId('cancel-button').click()
    await expect(page).toHaveURL('/')
  })
})
