import { chromium, FullConfig } from '@playwright/test'
import { execSync } from 'child_process'
import path from 'path'

const TEST_USER_EMAIL = 'e2e-test@example.com'

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'
  const projectRoot = path.resolve(__dirname, '..')

  // Seed the test user into the database
  execSync('npx tsx e2e/seed-test-user.ts', {
    cwd: projectRoot,
    stdio: 'pipe',
    env: { ...process.env },
  })

  // Sign in via the Credentials provider to get a session cookie
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Get CSRF token
  await page.goto(`${baseURL}/api/auth/csrf`)
  const csrfData = await page.evaluate(() =>
    JSON.parse(document.body.innerText)
  )
  const csrfToken = csrfData.csrfToken

  // Sign in with test credentials
  const signInResponse = await page.request.post(
    `${baseURL}/api/auth/callback/credentials`,
    {
      form: {
        email: TEST_USER_EMAIL,
        csrfToken,
        json: 'true',
      },
    }
  )

  if (!signInResponse.ok()) {
    throw new Error(`Failed to sign in: ${signInResponse.status()}`)
  }

  // Visit session endpoint to verify and finalize cookie
  await page.goto(`${baseURL}/api/auth/session`)
  const session = await page.evaluate(() => document.body.innerText)

  if (!session.includes(TEST_USER_EMAIL)) {
    throw new Error(`Session not established. Got: ${session}`)
  }

  // Save storage state (cookies) for tests
  await context.storageState({
    path: path.resolve(__dirname, '.auth-state.json'),
  })

  await browser.close()
}

export default globalSetup
