import { test } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  navigateToSignUp,
  navigateToSignIn,
} from '../support/navigation-helpers'
import { submitSignUpForm, submitSignInForm } from '../support/form-helpers'

test(
  'cannot access private page before email verification',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up page and submit form
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // Sign up with new credentials
    const newName = 'Unverified Access Test'
    const newEmail = 'unverified-access@example.com'
    const newPassword = 'unverifiedaccess123'

    await submitSignUpForm(page, {
      name: newName,
      email: newEmail,
      password: newPassword,
    })

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Now try to directly access the private page without being signed in
    await page.goto('http://localhost:3000/private')

    // Should be redirected back to sign-in page with access denied message
    await verifyOnSignInPage(page)
    await verifyAlert(page, 'You must sign in to visit that page')

    // Also verify that attempting to sign in with unverified credentials fails
    await navigateToSignIn(page)
    await submitSignInForm(page, { email: newEmail, password: newPassword })

    // Should be redirected to await verification page with email verification required message
    await verifyOnAwaitVerificationPage(page)
    await verifyAlert(
      page,
      'Please verify your email address before signing in. Check your email for a verification link.'
    )

    // Try to access private page again after failed sign-in attempt
    await page.goto('http://localhost:3000/private')

    // Should still be redirected back to sign-in page with access denied message
    await verifyOnSignInPage(page)
    await verifyAlert(page, 'You must sign in to visit that page')
  })
)
