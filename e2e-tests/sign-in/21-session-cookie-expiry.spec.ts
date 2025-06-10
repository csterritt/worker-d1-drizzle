import { test } from '@playwright/test'
import {
  startSignIn,
  submitEmail,
  submitCode,
  submitValidCode,
} from '../support/auth-helpers'
import {
  verifyOnStartupPage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import { PATHS, DURATIONS } from '../../src/constants'
import { verifyAlert } from '../support/finders' // Adjusted path for constants

const KNOWN_TEST_EMAIL = 'fredfred@team439980.testinator.com'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

test.describe('Session Cookie Expiry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:3000${PATHS.AUTH.RESET_CLOCK}`)
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)
  })

  test.afterEach(async ({ page }) => {
    await page.goto(`http://localhost:3000${PATHS.AUTH.RESET_CLOCK}`)
  })

  test('user should be redirected to sign-in after session expires', async ({
    page,
  }) => {
    // 1. Sign in a user
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)
    await startSignIn(page)
    await submitEmail(page, 'fredfred@team439980.testinator.com')
    await submitValidCode(page, '123456')

    // submitCode in auth-helpers usually verifies success and navigation to protected page
    // but we'll add an explicit verification here too.
    await verifyOnProtectedPage(page) // Ensures user is on /private

    // 2. Advance the server clock beyond session duration
    const sessionDuration = DURATIONS.SIX_MONTHS_IN_MILLISECONDS
    const timeOffset = sessionDuration + ONE_DAY_MS // 6 months + 1 day
    await page.goto(
      `http://localhost:3000${PATHS.AUTH.SET_CLOCK}/${timeOffset}`
    )

    // 3. Attempt to re-access a protected page
    await page.goto(`http://localhost:3000${PATHS.PRIVATE}`)

    // 4. Verify that the user is redirected to the sign-in page
    await verifyOnStartupPage(page)
    await verifyAlert(page, 'You must sign in to visit that page')
  })
})
