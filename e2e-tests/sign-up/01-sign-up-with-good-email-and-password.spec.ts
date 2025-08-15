import { test, expect } from '@playwright/test'

import { fillInput, clickLink } from '../support/finders'
import { verifyOnSignInPage, verifyOnAwaitVerificationPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'

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

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Verify the URL is the await verification page (no email parameter needed since we use cookies now)
    const currentUrl = page.url()
    expect(currentUrl).toContain('/auth/await-verification')
  })
)
