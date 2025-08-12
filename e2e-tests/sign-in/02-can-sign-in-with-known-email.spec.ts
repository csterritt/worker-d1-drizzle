import { test } from '@playwright/test'

import { startSignIn } from '../support/auth-helpers'
import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnProtectedPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/db-helpers'

test(
  'can sign in with known email',
  testWithDatabase(async ({ page }) => {
    // Navigate to startup page
    await page.goto('http://localhost:3000')

    // Start the sign-in process
    await startSignIn(page)

    // Sign in with a known email from the seeded database
    const knownEmail = 'fredfred@team439980.testinator.com'
    const knownPassword = 'freds-clever-password'

    await fillInput(page, 'email-input', knownEmail)
    await fillInput(page, 'password-input', knownPassword)
    await clickLink(page, 'submit')

    // Check for success alert message first (it might appear briefly)
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')

    // Should be redirected to the protected page after successful sign-in
    await verifyOnProtectedPage(page)
  })
)
