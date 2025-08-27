import { test } from '@playwright/test'

import { startSignIn } from '../support/auth-helpers'
import { verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToHome } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'

test(
  'cannot sign in with wrong password',
  testWithDatabase(async ({ page }) => {
    // Navigate to startup page
    await navigateToHome(page)

    // Start the sign-in process
    await startSignIn(page)

    // Try to sign in with a known email but wrong password
    const knownEmail = 'fredfred@team439980.testinator.com'
    const wrongPassword = 'this-is-definitely-wrong-password'

    await submitSignInForm(page, { email: knownEmail, password: wrongPassword })

    // Should remain on sign-in page (not redirect to protected page)
    await verifyOnSignInPage(page)

    // Should show an error message indicating invalid credentials
    await verifyAlert(
      page,
      'Invalid email or password. Please check your credentials and try again.'
    )
  })
)
