import { test, expect } from '@playwright/test'

test.describe('New Workout page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workouts/new')
  })

  test('creates a new workout with single exercise', async ({ page }) => {
    await page.getByTestId('workout-name-input').fill('My Test Workout')
    await page.getByTestId('exercise-name-input-0-0').fill('Push-ups')
    await page.getByTestId('create-workout-button').click()

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('heading', { name: 'My Test Workout' }).first()
    ).toBeVisible()
  })

  test('creates workout with multiple exercises', async ({ page }) => {
    await page.getByTestId('workout-name-input').fill('Multi Exercise Workout')
    await page.getByTestId('exercise-name-input-0-0').fill('Push-ups')

    await page.getByTestId('add-exercise-button-0').click()
    await page.getByTestId('exercise-name-input-0-1').fill('Squats')

    await page.getByTestId('add-exercise-button-0').click()
    await page.getByTestId('exercise-name-input-0-2').fill('Lunges')

    await page.getByTestId('create-workout-button').click()

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('heading', { name: 'Multi Exercise Workout' }).first()
    ).toBeVisible()
  })

  test('removes exercise from form', async ({ page }) => {
    await page.getByTestId('exercise-name-input-0-0').fill('Push-ups')
    await page.getByTestId('add-exercise-button-0').click()
    await page.getByTestId('exercise-name-input-0-1').fill('Squats')

    await page.getByTestId('remove-exercise-button-0-1').click()

    const secondInput = page.getByTestId('exercise-name-input-0-1')
    await expect(secondInput).not.toBeVisible()
  })

  test('validates required name field', async ({ page }) => {
    const createButton = page.getByTestId('create-workout-button')
    await expect(createButton).toBeDisabled()

    await page.getByTestId('workout-name-input').fill('Test')
    await expect(createButton).toBeEnabled()
  })

  test('cancels and returns to home', async ({ page }) => {
    await page.getByTestId('cancel-button').click()
    await expect(page).toHaveURL('/')
  })
})
