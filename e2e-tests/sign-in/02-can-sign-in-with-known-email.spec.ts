import { test } from '@playwright/test'

import { startSignIn } from '../support/auth-helpers'
import { verifyAlert } from '../support/finders'
import { verifyOnProtectedPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToHome } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'

test(
  'can sign in with known email',
  testWithDatabase(async ({ page }) => {
    // Navigate to startup page
    await navigateToHome(page)

    // Start the sign-in process
    await startSignIn(page)

    // Sign in with a known email from the seeded database
    const knownEmail = 'fredfred@team439980.testinator.com'
    const knownPassword = 'freds-clever-password'

    await submitSignInForm(page, { email: knownEmail, password: knownPassword })

    // Check for success alert message first (it might appear briefly)
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')

    // Should be redirected to the protected page after successful sign-in
    await verifyOnProtectedPage(page)
  })
)
