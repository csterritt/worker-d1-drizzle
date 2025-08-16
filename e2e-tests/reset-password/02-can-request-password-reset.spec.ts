import { expect, test } from '@playwright/test'

import { clickLink, fillInput, verifyAlert } from '../support/finders'
import { testWithDatabase } from '../support/test-helpers'
import {
  verifyOnForgotPasswordPage,
  verifyOnWaitingForResetPage,
} from '../support/page-verifiers'

test(
  'can request password reset with valid email',
  testWithDatabase(async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('http://localhost:3000/auth/forgot-password')
    await verifyOnForgotPasswordPage(page)

    // Use a known email from the test database (fredfred@team439980.testinator.com)
    const email = 'fredfred@team439980.testinator.com'

    await fillInput(page, 'forgot-email-input', email)
    await clickLink(page, 'forgot-password-submit')

    // Should be redirected to waiting for reset page
    await verifyOnWaitingForResetPage(page)

    // Verify the URL is the waiting for reset page
    expect(page.url()).toContain('/auth/waiting-for-reset')

    // Verify success message
    await verifyAlert(
      page,
      "If an account with that email exists, we've sent you a password reset link."
    )

    // Verify all elements are present on waiting page
    expect(
      await page
        .locator('[data-testid="back-to-sign-in-from-waiting"]')
        .isVisible()
    ).toBe(true)
    expect(
      await page.locator('[data-testid="try-again-button"]').isVisible()
    ).toBe(true)
  })
)

test(
  'shows same message for non-existent email (prevents enumeration)',
  testWithDatabase(async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('http://localhost:3000/auth/forgot-password')
    await verifyOnForgotPasswordPage(page)

    // Use a non-existent email
    const email = 'nonexistent@example.com'

    await fillInput(page, 'forgot-email-input', email)
    await clickLink(page, 'forgot-password-submit')

    // Should be redirected to waiting for reset page (same as valid email)
    await verifyOnWaitingForResetPage(page)

    // Verify the URL is the waiting for reset page
    expect(page.url()).toContain('/auth/waiting-for-reset')

    // Verify same success message (prevents email enumeration)
    await verifyAlert(
      page,
      "If an account with that email exists, we've sent you a password reset link."
    )
  })
)

test('shows error for invalid email format', async ({ page }) => {
  // Navigate to forgot password page
  await page.goto('http://localhost:3000/auth/forgot-password')
  await verifyOnForgotPasswordPage(page)

  // Use an invalid email format
  const invalidEmail = 'not-an-email'

  await fillInput(page, 'forgot-email-input', invalidEmail)
  await clickLink(page, 'forgot-password-submit')

  // Should stay on forgot password page with error message
  await verifyOnForgotPasswordPage(page)

  // Verify error message
  await verifyAlert(page, 'Please enter a valid email address.')
})

test('shows error for empty email', async ({ page }) => {
  // Navigate to forgot password page
  await page.goto('http://localhost:3000/auth/forgot-password')
  await verifyOnForgotPasswordPage(page)

  // Submit without entering email
  await clickLink(page, 'forgot-password-submit')

  // Should stay on forgot password page with error message
  await verifyOnForgotPasswordPage(page)

  // Verify error message
  await verifyAlert(page, 'Please enter your email address.')
})
