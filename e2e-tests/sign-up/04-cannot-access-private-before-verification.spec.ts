import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'

test(
  'cannot access private page before email verification',
  testWithDatabase(async ({ page }) => {
    // Navigate to sign-in page (which contains the sign-up form)
    await page.goto('http://localhost:3000/auth/sign-in')

    // Verify we're on the sign-in page
    await verifyOnSignInPage(page)

    // Sign up with new credentials
    const newName = 'Unverified Access Test'
    const newEmail = 'unverified-access@example.com'
    const newPassword = 'unverifiedaccess123'

    await fillInput(page, 'signup-name-input', newName)
    await fillInput(page, 'signup-email-input', newEmail)
    await fillInput(page, 'signup-password-input', newPassword)
    await clickLink(page, 'signup-submit')

    // Should be redirected back to sign-in page with success message
    await verifyOnSignInPage(page)
    await verifyAlert(
      page,
      'Account created! Please check your email to verify your account.'
    )

    // Now try to directly access the private page without being signed in
    await page.goto('http://localhost:3000/private')

    // Should be redirected back to sign-in page with access denied message
    await verifyOnSignInPage(page)
    await verifyAlert(page, 'You must sign in to visit that page')

    // Also verify that attempting to sign in with unverified credentials fails
    await fillInput(page, 'email-input', newEmail)
    await fillInput(page, 'password-input', newPassword)
    await clickLink(page, 'submit')

    // Should stay on sign-in page with email verification required message
    await verifyOnSignInPage(page)
    await verifyAlert(
      page,
      'Please verify your email address before signing in. Check your email for a verification link.'
    )

    // Try to access private page again after failed sign-in attempt
    await page.goto('http://localhost:3000/private')

    // Should still be redirected back to sign-in page
    await verifyOnSignInPage(page)
    await verifyAlert(page, 'You must sign in to visit that page')
  })
)
