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
  'must validate email before signing in',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up and submit form
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // First, sign up with new credentials
    const newName = 'Unverified User'
    const newEmail = 'unverified@example.com'
    const newPassword = 'unverifiedpassword123'

    await submitSignUpForm(page, {
      name: newName,
      email: newEmail,
      password: newPassword,
    })

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Navigate back to sign-in page to attempt sign-in
    await navigateToSignIn(page)
    await verifyOnSignInPage(page)

    // Now try to sign in with the same credentials without verifying email
    await submitSignInForm(page, { email: newEmail, password: newPassword })

    // Should be redirected to await verification page with email verification required message
    await verifyOnAwaitVerificationPage(page)
    await verifyAlert(
      page,
      'Please verify your email address before signing in. Check your email for a verification link.'
    )
  })
)
