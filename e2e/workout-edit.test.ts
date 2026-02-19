import { test, expect, Page } from '@playwright/test'

// Generate unique workout names to avoid collisions between parallel tests
let nameCounter = 0
function uniqueName(base: string): string {
  nameCounter++
  return `${base} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${nameCounter}`
}

async function createWorkout(
  page: Page,
  name: string,
  exercises: string[] = ['Burpees']
) {
  await page.goto('/workouts/new')
  await page.getByTestId('workout-name-input').fill(name)
  await page.getByTestId('exercise-name-input-0').fill(exercises[0])
  for (let i = 1; i < exercises.length; i++) {
    await page.getByTestId('add-exercise-button').click()
    await page.getByTestId(`exercise-name-input-${i}`).fill(exercises[i])
  }
  await page.getByTestId('create-workout-button').click()
  await expect(page).toHaveURL('/')
}

async function clickWorkoutAction(
  page: Page,
  workoutName: string,
  action: 'Edit' | 'Start' | 'Delete'
) {
  const card = page.locator('[data-testid^="workout-card-"]', {
    hasText: workoutName,
  })
  if (action === 'Edit') {
    await card.locator('a', { hasText: 'Edit' }).click()
  } else if (action === 'Start') {
    await card.getByText('Start').click()
  } else if (action === 'Delete') {
    await card.getByText('Delete').click()
  }
}

test.describe('Edit Workout page', () => {
  test('loads existing workout data', async ({ page }) => {
    const name = uniqueName('Load Test')
    await createWorkout(page, name, ['Burpees'])
    await clickWorkoutAction(page, name, 'Edit')

    await expect(page.getByTestId('workout-name-input')).toHaveValue(name)
    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Burpees'
    )
  })

  test('updates workout name', async ({ page }) => {
    const name = uniqueName('Name Update')
    const updatedName = uniqueName('Updated Name')
    await createWorkout(page, name, ['Burpees'])
    await clickWorkoutAction(page, name, 'Edit')

    await expect(page.getByTestId('workout-name-input')).toHaveValue(name)
    await page.getByTestId('workout-name-input').fill(updatedName)

    // Wait for the PATCH to complete before navigation
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/workouts/') && resp.status() === 200
      ),
      page.getByTestId('update-workout-button').click(),
    ])

    await expect(page).toHaveURL('/')
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 })
  })

  test('adds new exercise when editing', async ({ page }) => {
    const name = uniqueName('Add Exercise')
    await createWorkout(page, name, ['Burpees'])
    await clickWorkoutAction(page, name, 'Edit')

    // Wait for workout data to load
    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Burpees'
    )

    await page.getByTestId('add-exercise-button').click()
    // Wait for the new exercise input to be visible before filling
    await expect(page.getByTestId('exercise-name-input-1')).toBeVisible()
    await page.getByTestId('exercise-name-input-1').fill('Planks')
    // Verify the value was set before submitting
    await expect(page.getByTestId('exercise-name-input-1')).toHaveValue(
      'Planks'
    )

    // Click update and wait for the API call to complete
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/workouts/') && resp.status() === 200
      ),
      page.getByTestId('update-workout-button').click(),
    ])

    await expect(page).toHaveURL('/')
    await clickWorkoutAction(page, name, 'Edit')

    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Burpees'
    )
    await expect(page.getByTestId('exercise-name-input-1')).toHaveValue(
      'Planks'
    )
  })

  test('removes exercise when editing', async ({ page }) => {
    const name = uniqueName('Remove Exercise')
    await createWorkout(page, name, ['Push-ups', 'Squats'])

    await clickWorkoutAction(page, name, 'Edit')

    await expect(page.getByTestId('workout-name-input')).toHaveValue(name)
    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Push-ups'
    )
    await expect(page.getByTestId('exercise-name-input-1')).toHaveValue(
      'Squats'
    )

    await page.getByTestId('remove-exercise-button-1').click()
    await page.getByTestId('update-workout-button').click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText(name)).toBeVisible()

    await clickWorkoutAction(page, name, 'Edit')

    await expect(page.getByTestId('exercise-name-input-0')).toHaveValue(
      'Push-ups'
    )
    await expect(page.getByTestId('exercise-name-input-1')).not.toBeVisible()
  })

  test('cancels edit and returns to home', async ({ page }) => {
    const name = uniqueName('Cancel Edit')
    await createWorkout(page, name, ['Burpees'])
    await clickWorkoutAction(page, name, 'Edit')

    await page.getByTestId('cancel-button').click()
    await expect(page).toHaveURL('/')
  })
})
