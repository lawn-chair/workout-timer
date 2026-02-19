import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page links work', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('new-workout-button')).toBeVisible()
  })

  test('new workout page accessible from home', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('new-workout-button').click()
    await expect(page).toHaveURL('/workouts/new')
  })

  test('workout creation navigates to home', async ({ page }) => {
    await page.goto('/workouts/new')
    await page.getByTestId('workout-name-input').fill('Nav Test')
    await page.getByTestId('exercise-name-input-0-0').fill('Test')
    await page.getByTestId('create-workout-button').click()
    await expect(page).toHaveURL('/')
  })

  test('timer page redirects without workout', async ({ page }) => {
    await page.goto('/timer')
    await expect(page).toHaveURL('/')
  })

  test('workout list shows correct exercise count', async ({ page }) => {
    await page.goto('/workouts/new')
    await page.getByTestId('workout-name-input').fill('Exercise Count Test')
    await page.getByTestId('exercise-name-input-0-0').fill('Push-ups')
    await page.getByTestId('add-exercise-button-0').click()
    await page.getByTestId('exercise-name-input-0-1').fill('Squats')
    await page.getByTestId('create-workout-button').click()

    await expect(page.getByText('2 exercises')).toBeVisible()
  })
})
