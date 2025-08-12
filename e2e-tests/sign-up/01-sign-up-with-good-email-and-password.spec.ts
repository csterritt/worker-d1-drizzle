import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/db-helpers'

test(
  'sign up with good email and password',
  testWithDatabase(async ({ page }) => {
    // Navigate to sign-in page (which contains the sign-up form)
    await page.goto('http://localhost:3000/auth/sign-in')

    // Verify we're on the sign-in page
    await verifyOnSignInPage(page)

    // Fill out the sign-up form with new credentials
    const newName = 'Test User'
    const newEmail = 'testuser@example.com'
    const newPassword = 'securepassword123'

    await fillInput(page, 'signup-name-input', newName)
    await fillInput(page, 'signup-email-input', newEmail)
    await fillInput(page, 'signup-password-input', newPassword)
    await clickLink(page, 'signup-submit')

    // Should be redirected back to sign-in page with success message
    await verifyOnSignInPage(page)

    // Should show success message directing user to check email
    await verifyAlert(
      page,
      'Account created! Please check your email to verify your account.'
    )
  })
)
