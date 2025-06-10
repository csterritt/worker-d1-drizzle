import { test } from '@playwright/test'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  submitExpiredCode,
  cancelSignIn,
} from '../support/auth-helpers'

test('submitting an expired code shows token expired error', async ({
  page,
}) => {
  try {
    // Set the clock to sixteen minutes ago
    const ago = -16 * 60 * 1000
    await page.goto(`http://localhost:3000/auth/set-clock/${ago}`)

    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Capture the response to get the session token from the headers
    const responsePromise = page.waitForResponse('**/auth/**')

    // Submit known email and verify success
    await submitEmail(page, 'fredfred@team439980.testinator.com')
    const response = await responsePromise

    const headers = response.headers()
    const firstCode = headers['x-session-token']

    // Read the first OTP code using our retry mechanism
    console.log('First code:', JSON.stringify(firstCode))

    // Move the clock forward to make the code expired
    await page.goto(`http://localhost:3000/auth/reset-clock`)
    await page.goto('http://localhost:3000/auth/await-code')

    // Submit expired code and verify error
    await submitExpiredCode(page, firstCode)

    // Cancel to reset internal state
    await cancelSignIn(page)
  } finally {
    // Reset the clock
    await page.goto(`http://localhost:3000/auth/reset-clock`)
  }
})
