import { test, expect } from '@playwright/test'

test.describe('Timer page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workouts/new')
    await page.getByTestId('workout-name-input').fill('Timer Test Workout')
    await page.getByTestId('exercise-name-input-0-0').fill('Jumping Jacks')
    await page.getByTestId('create-workout-button').click()
  })

  test('redirects to home when no workout loaded', async ({ page }) => {
    await page.goto('/timer')
    await expect(page).toHaveURL('/')
  })

  test('starts timer from home page', async ({ page }) => {
    await page
      .getByTestId(/start-workout-/)
      .first()
      .click()
    await expect(page).toHaveURL('/timer')
    await expect(page.getByTestId('timer-display')).toBeVisible()
    await expect(page.getByTestId('timer-phase')).toHaveText('Ready')
  })

  test('shows get ready phase when start button clicked', async ({ page }) => {
    await page
      .getByTestId(/start-workout-/)
      .first()
      .click()
    await page.getByTestId('timer-start-button').click()
    await expect(page.getByTestId('timer-phase')).toHaveText('Get Ready')
  })

  test('pause button appears when timer is running', async ({ page }) => {
    await page
      .getByTestId(/start-workout-/)
      .first()
      .click()
    await page.getByTestId('timer-start-button').click()
    await expect(page.getByTestId('timer-pause-button')).toBeVisible()
    await expect(page.getByTestId('timer-stop-button')).toBeVisible()
    await expect(page.getByTestId('timer-skip-button')).toBeVisible()
  })

  test('pause and resume timer', async ({ page }) => {
    await page
      .getByTestId(/start-workout-/)
      .first()
      .click()
    await page.getByTestId('timer-start-button').click()

    const pauseButton = page.getByTestId('timer-pause-button')
    await expect(pauseButton).toContainText('⏸')

    await pauseButton.click()
    await expect(pauseButton).toContainText('▶')

    await pauseButton.click()
    await expect(pauseButton).toContainText('⏸')
  })

  test('skip button changes phase', async ({ page }) => {
    await page
      .getByTestId(/start-workout-/)
      .first()
      .click()
    await page.getByTestId('timer-start-button').click()

    const phaseBefore = await page.getByTestId('timer-phase').textContent()
    await page.getByTestId('timer-skip-button').click()
    const phaseAfter = await page.getByTestId('timer-phase').textContent()

    expect(phaseBefore).not.toBe(phaseAfter)
  })

  test('stop button returns to home page', async ({ page }) => {
    await page
      .getByTestId(/start-workout-/)
      .first()
      .click()
    await page.getByTestId('timer-start-button').click()
    await page.getByTestId('timer-stop-button').click()
    await expect(page).toHaveURL('/')
  })
})
