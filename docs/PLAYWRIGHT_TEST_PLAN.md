# Playwright Test Implementation Plan

## Overview

Add Playwright e2e tests for all existing features and configure automatic testing on code changes.

## Current State

- **Unit/Component Tests**: Vitest (existing in `src/**/*.test.{ts,tsx}`)
- **Test Coverage**: Business logic (workout store, timer store, audio)
- **Missing**: End-to-end browser tests

## Features to Test

| Page                                 | Features                                                            |
| ------------------------------------ | ------------------------------------------------------------------- |
| Home (`/`)                           | Workout list display, empty state, create/delete/start/edit buttons |
| New Workout (`/workouts/new`)        | Form submission, add/remove exercises, validation                   |
| Edit Workout (`/workouts/[id]/edit`) | Load existing workout, update, cancel                               |
| Timer (`/timer`)                     | Start, pause, resume, skip, stop, complete flow                     |

## Implementation Steps

### 1. Install Dependencies

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

### 2. Create `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 3. Add Test IDs to Components

Add `data-testid` attributes for stable selectors:

| Element                | Test ID                          |
| ---------------------- | -------------------------------- |
| Workout card           | `workout-card-{id}`              |
| Start button           | `start-workout-{id}`             |
| Edit button            | `edit-workout-{id}`              |
| Delete button          | `delete-workout-{id}`            |
| New workout button     | `new-workout-button`             |
| Workout name input     | `workout-name-input`             |
| Exercise name input    | `exercise-name-input-{index}`    |
| Add exercise button    | `add-exercise-button`            |
| Remove exercise button | `remove-exercise-button-{index}` |
| Create workout button  | `create-workout-button`          |
| Update workout button  | `update-workout-button`          |
| Cancel button          | `cancel-button`                  |
| Timer display          | `timer-display`                  |
| Timer phase label      | `timer-phase`                    |
| Start button           | `timer-start-button`             |
| Pause/Resume button    | `timer-pause-button`             |
| Skip button            | `timer-skip-button`              |
| Stop button            | `timer-stop-button`              |

### 4. Create E2E Test Files

```
e2e/
├── home.test.ts           # Workout list, empty state, create/delete/start/edit
├── workout-new.test.ts   # Create workout form, add/remove exercises
├── workout-edit.test.ts  # Load workout, update, cancel
├── timer.test.ts         # Start, pause, resume, skip, stop (clock mocking)
└── navigation.test.ts    # Route transitions
```

### 5. Add Test Scripts to `package.json`

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed"
}
```

### 6. Update `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npx playwright test --project=chromium
```

### 7. Update `check` Script

```json
{
  "check": "npm run lint && npm run typecheck && npm run test:run && npm run test:e2e"
}
```

## Timer Testing with Clock

Use Playwright's clock API to control time in timer tests:

```typescript
test('timer complete flow', async ({ page }) => {
  // Setup: Navigate and load workout
  await page.goto('/')
  await page.click('[data-testid="start-workout-1"]')

  // Use Playwright clock to fake time
  await page.clock.install()

  // Start timer
  await page.click('[data-testid="timer-start-button"]')

  // Advance clock through countdown (3 seconds)
  await page.clock.tick(3000)

  // Advance through work phase (30 seconds)
  await page.clock.tick(30000)

  // Verify rest phase
  await expect(page.locator('[data-testid="timer-phase"]')).toHaveText('Rest')

  await page.clock.runAll()
})
```

## Handling Browser Dialogs

Handle `confirm()` dialogs for delete:

```typescript
test('delete workout', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept())
  await page.click('[data-testid="delete-workout-1"]')
})
```

## Running Tests

| Command                                  | Description              |
| ---------------------------------------- | ------------------------ |
| `npm run test:e2e`                       | Run all e2e tests        |
| `npm run test:e2e:headed`                | Run with visible browser |
| `npm run test:e2e:ui`                    | Run with Playwright UI   |
| `npx playwright test --project=chromium` | Run specific project     |

## Notes

- Timer tests use Playwright clock for deterministic timing
- Delete confirmation handled via `page.on('dialog')`
- Tests run against dev server (`npm run dev`)
- Chromium only for faster execution
