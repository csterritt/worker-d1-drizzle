import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'

test(
  'duplicate unverified sign-up redirects to await verification page',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up page
    await page.goto('http://localhost:3000/auth/sign-up')

    // Verify we're on the sign-up page
    await verifyOnSignUpPage(page)

    // First, sign up with new credentials
    const newName = 'Duplicate Test User'
    const newEmail = 'duplicate-test@example.com'
    const newPassword = 'duplicatetest123'

    await fillInput(page, 'signup-name-input', newName)
    await fillInput(page, 'signup-email-input', newEmail)
    await fillInput(page, 'signup-password-input', newPassword)
    await clickLink(page, 'signup-action')

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Navigate back to sign-up page to attempt duplicate sign-up
    await page.goto('http://localhost:3000/auth/sign-up')
    await verifyOnSignUpPage(page)

    // Now try to sign up again with the same email (but different name/password)
    await fillInput(page, 'signup-name-input', 'Different Name')
    await fillInput(page, 'signup-email-input', newEmail) // Same email
    await fillInput(page, 'signup-password-input', 'differentpassword456')
    await clickLink(page, 'signup-action')

    // Should be redirected to await verification page with appropriate message
    await verifyOnAwaitVerificationPage(page)
    await verifyAlert(
      page,
      'An account with this email already exists. Please check your email for a verification link or sign in if you have already verified your account.'
    )
  })
)
