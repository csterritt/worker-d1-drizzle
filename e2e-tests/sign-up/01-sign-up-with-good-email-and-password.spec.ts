import { test, expect } from '@playwright/test'

import { fillInput, clickLink } from '../support/finders'
import {
  verifyOnSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'

test(
  'sign up with good email and password',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up page
    await page.goto('http://localhost:3000/auth/sign-up')

    // Verify we're on the sign-up page
    await verifyOnSignUpPage(page)

    // Fill out the sign-up form with new credentials
    const newName = 'Test User'
    const newEmail = 'testuser@example.com'
    const newPassword = 'securepassword123'

    await fillInput(page, 'signup-name-input', newName)
    await fillInput(page, 'signup-email-input', newEmail)
    await fillInput(page, 'signup-password-input', newPassword)
    await clickLink(page, 'signup-submit')

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Verify the URL is the await verification page (no email parameter needed since we use cookies now)
    const currentUrl = page.url()
    expect(currentUrl).toContain('/auth/await-verification')
  })
)
