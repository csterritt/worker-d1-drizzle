import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'

test(
  'unverified user sign-in redirects to await verification page',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up page
    await page.goto('http://localhost:3000/auth/sign-up')

    // Verify we're on the sign-up page
    await verifyOnSignUpPage(page)

    // First, sign up with new credentials
    const newName = 'Redirect Test User'
    const newEmail = 'redirect-test@example.com'
    const newPassword = 'redirecttest123'

    await fillInput(page, 'signup-name-input', newName)
    await fillInput(page, 'signup-email-input', newEmail)
    await fillInput(page, 'signup-password-input', newPassword)
    await clickLink(page, 'signup-submit')

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Navigate back to sign-in page to attempt sign-in
    await page.goto('http://localhost:3000/auth/sign-in')
    await verifyOnSignInPage(page)

    // Now try to sign in with the same credentials without verifying email
    await fillInput(page, 'email-input', newEmail)
    await fillInput(page, 'password-input', newPassword)
    await clickLink(page, 'submit')

    // Should be redirected to await verification page (not stay on sign-in page)
    await verifyOnAwaitVerificationPage(page)
    await verifyAlert(
      page,
      'Please verify your email address before signing in. Check your email for a verification link.'
    )
  })
)
