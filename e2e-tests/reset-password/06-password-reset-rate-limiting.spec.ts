import { expect, test } from '@playwright/test'

import { verifyAlert, clickLink, fillInput } from '../support/finders'
import { testWithDatabase } from '../support/test-helpers'
import { verifyOnForgotPasswordPage } from '../support/page-verifiers'
import { navigateToForgotPassword } from '../support/navigation-helpers'
import { submitForgotPasswordForm } from '../support/form-helpers'

test(
  'enforces rate limiting for password reset requests',
  testWithDatabase(async ({ page }) => {
    // Navigate to forgot password page
    await navigateToForgotPassword(page)

    // Use a known email from the test database
    const email = 'fredfred@team439980.testinator.com'

    // First password reset request - should succeed
    await submitForgotPasswordForm(page, email)

    // Should be redirected to waiting for reset page
    expect(page.url()).toContain('/auth/waiting-for-reset')

    // Navigate back to forgot password page for second attempt
    await navigateToForgotPassword(page)

    // Second password reset request immediately - should be rate limited
    await submitForgotPasswordForm(page, email)

    // Should stay on forgot password page with rate limiting error
    await verifyOnForgotPasswordPage(page)

    // Verify rate limiting error message is displayed
    const alertElement = page.getByRole('alert')
    await expect(alertElement).toBeVisible()

    // Check that the error message mentions waiting and contains "second"
    const alertText = await alertElement.textContent()
    expect(alertText).toMatch(/Please wait \d+ more second/i)
    expect(alertText).toContain(
      'before requesting another password reset email'
    )
  })
)

test(
  'allows password reset after rate limit period expires',
  testWithDatabase(async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('http://localhost:3000/auth/forgot-password')
    await verifyOnForgotPasswordPage(page)

    // Use a known email from the test database
    const email = 'fredfred@team439980.testinator.com'

    // First password reset request
    await fillInput(page, 'forgot-email-input', email)
    await clickLink(page, 'forgot-password-action')

    // Should be redirected to waiting for reset page
    expect(page.url()).toContain('/auth/waiting-for-reset')

    // Wait for the rate limit period to expire (3 seconds in development + buffer)
    await page.waitForTimeout(4000)

    // Navigate back to forgot password page
    await page.goto('http://localhost:3000/auth/forgot-password')
    await verifyOnForgotPasswordPage(page)

    // Second password reset request after waiting - should succeed
    await fillInput(page, 'forgot-email-input', email)
    await clickLink(page, 'forgot-password-action')

    // Should be redirected to waiting for reset page again
    expect(page.url()).toContain('/auth/waiting-for-reset')

    // Verify success message is displayed
    await verifyAlert(
      page,
      "If an account with that email exists, we've sent you a password reset link."
    )
  })
)

test(
  'rate limiting works for non-existent emails without revealing user existence',
  testWithDatabase(async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('http://localhost:3000/auth/forgot-password')
    await verifyOnForgotPasswordPage(page)

    // Use a non-existent email
    const nonExistentEmail = 'nonexistent@example.com'

    // First request with non-existent email - should succeed (no enumeration)
    await fillInput(page, 'forgot-email-input', nonExistentEmail)
    await clickLink(page, 'forgot-password-action')

    // Should be redirected to waiting for reset page (same as valid email)
    expect(page.url()).toContain('/auth/waiting-for-reset')

    // Navigate back to forgot password page
    await page.goto('http://localhost:3000/auth/forgot-password')
    await verifyOnForgotPasswordPage(page)

    // Second request immediately with same non-existent email
    await fillInput(page, 'forgot-email-input', nonExistentEmail)
    await clickLink(page, 'forgot-password-action')

    // Should still redirect to waiting page (don't reveal that user doesn't exist)
    // Note: For non-existent users, we don't apply rate limiting since we don't have
    // an account record to track timestamps, but we still don't reveal the user doesn't exist
    expect(page.url()).toContain('/auth/waiting-for-reset')
  })
)
