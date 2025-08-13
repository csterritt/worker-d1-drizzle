import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/db-helpers'

test(
  'must validate email before signing in',
  testWithDatabase(async ({ page }) => {
    // Navigate to sign-in page (which contains the sign-up form)
    await page.goto('http://localhost:3000/auth/sign-in')

    // Verify we're on the sign-in page
    await verifyOnSignInPage(page)

    // First, sign up with new credentials
    const newName = 'Unverified User'
    const newEmail = 'unverified@example.com'
    const newPassword = 'unverifiedpassword123'

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

    // Now try to sign in with the same credentials without verifying email
    await fillInput(page, 'email-input', newEmail)
    await fillInput(page, 'password-input', newPassword)
    await clickLink(page, 'submit')

    // Should stay on sign-in page with email verification required message
    await verifyOnSignInPage(page)
    await verifyAlert(
      page,
      'Please verify your email address before signing in. Check your email for a verification link.'
    )
  })
)
