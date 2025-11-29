import { test } from '@playwright/test'

import { startSignIn } from '../support/auth-helpers'
import { verifyAlert } from '../support/finders'
import { verifyOnProtectedPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToHome } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS, ERROR_MESSAGES } from '../support/test-data'

test(
  'can sign in with known email',
  testWithDatabase(async ({ page }) => {
    // Navigate to startup page
    await navigateToHome(page)

    // Start the sign-in process
    await startSignIn(page)

    // Sign in with a known email from the seeded database
    await submitSignInForm(page, {
      email: TEST_USERS.KNOWN_USER.email,
      password: TEST_USERS.KNOWN_USER.password,
    })

    // Check for success alert message first (it might appear briefly)
    await verifyAlert(page, ERROR_MESSAGES.SIGN_IN_SUCCESS)

    // Should be redirected to the protected page after successful sign-in
    await verifyOnProtectedPage(page)
  })
)
