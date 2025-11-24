import { expect, test } from '@playwright/test'

import { verifyAlert, isElementVisible } from '../support/finders'
import {
  verifyOnForgotPasswordPage,
  verifyOnWaitingForResetPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { completeForgotPasswordFlow } from '../support/workflow-helpers'
import { navigateToForgotPassword } from '../support/navigation-helpers'
import { submitForgotPasswordForm } from '../support/form-helpers'

test(
  'can request password reset with valid email',
  testWithDatabase(async ({ page }) => {
    // Complete the entire forgot password flow with known user
    await completeForgotPasswordFlow(page)

    // Verify the URL is the waiting for reset page
    expect(page.url()).toContain('/auth/waiting-for-reset')

    // Verify all elements are present on waiting page
    expect(await isElementVisible(page, 'back-to-sign-in-from-waiting')).toBe(
      true
    )
    expect(await isElementVisible(page, 'try-again-action')).toBe(true)
  })
)

test(
  'shows same message for non-existent email (prevents enumeration)',
  testWithDatabase(async ({ page }) => {
    // Navigate to forgot password page
    await navigateToForgotPassword(page)

    // Use a non-existent email
    const email = 'nonexistent@example.com'

    await submitForgotPasswordForm(page, email)

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
  await navigateToForgotPassword(page)

  // Use an invalid email format
  const invalidEmail = 'not-an-email'

  await submitForgotPasswordForm(page, invalidEmail)

  // Should stay on forgot password page with error message
  await verifyOnForgotPasswordPage(page)

  // Verify error message
  await verifyAlert(page, 'Please enter a valid email address.')
})

test('shows error for empty email', async ({ page }) => {
  // Navigate to forgot password page
  await navigateToForgotPassword(page)

  // Submit without entering email
  // Using form-helpers submit without parameter isn't supported for empty, so click submit directly
  const submit = page.getByTestId('forgot-password-action')
  await submit.click()

  // Should stay on forgot password page with error message
  await verifyOnForgotPasswordPage(page)

  // Verify error message
  await verifyAlert(page, 'Please enter a valid email address.')
})
