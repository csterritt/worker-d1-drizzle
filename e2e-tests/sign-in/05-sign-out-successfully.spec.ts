import { test } from '@playwright/test'

import { startSignIn } from '../support/auth-helpers'
import { clickLink, verifyAlert, getElementText } from '../support/finders'
import {
  verifyOnProtectedPage,
  verifyOnStartupPage,
  verifyOnSignInPage,
  verifyOnSignOutPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToHome } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS, ERROR_MESSAGES, BASE_URLS } from '../support/test-data'

test(
  'sign out successfully after signing in',
  testWithDatabase(async ({ page }) => {
    // Navigate to startup page
    await navigateToHome(page)

    // Start the sign-in process
    await startSignIn(page)

    // Sign in with valid credentials
    await submitSignInForm(page, {
      email: TEST_USERS.KNOWN_USER.email,
      password: TEST_USERS.KNOWN_USER.password,
    })

    // Verify successful sign-in
    await verifyAlert(page, ERROR_MESSAGES.SIGN_IN_SUCCESS)
    await verifyOnProtectedPage(page)

    // Now sign out
    await clickLink(page, 'sign-out-action')

    // Verify we land on the sign-out page
    await verifyOnSignOutPage(page)

    // Verify the success message is displayed
    const pageText = await page.textContent('body')
    if (!pageText?.includes(ERROR_MESSAGES.SIGN_OUT_SUCCESS)) {
      throw new Error(
        `Expected to find "${ERROR_MESSAGES.SIGN_OUT_SUCCESS}" on sign-out page`
      )
    }

    // Click the Home button
    await clickLink(page, 'go-home-action')

    // Verify we're on the startup page
    await verifyOnStartupPage(page)

    // Try to access the private page again - should be redirected to sign-in
    await page.goto(BASE_URLS.PRIVATE)

    // Should be redirected to sign-in page
    await verifyOnSignInPage(page)

    // Should show the access denied message
    await verifyAlert(page, ERROR_MESSAGES.MUST_SIGN_IN)
  })
)
