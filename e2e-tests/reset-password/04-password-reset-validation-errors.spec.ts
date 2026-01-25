import { test, expect } from '@playwright/test'

import {
  fillInput,
  clickLink,
  verifyAlert,
  isElementVisible,
} from '../support/finders'
import {
  verifyOnResetPasswordPage,
  verifyOnInvalidTokenPage,
} from '../support/page-verifiers'

test('shows invalid token page when no token provided', async ({ page }) => {
  // Navigate to reset password page without token
  await page.goto('http://localhost:3000/auth/reset-password')

  // Should show invalid token page
  await verifyOnInvalidTokenPage(page)

  // Verify error message
  expect(await page.locator('h2').textContent()).toContain('Invalid Reset Link')

  // Verify navigation buttons are present
  expect(await isElementVisible(page, 'request-new-reset-action')).toBe(true)
  expect(await isElementVisible(page, 'back-to-sign-in-from-invalid')).toBe(
    true
  )
})

test('shows validation errors for password reset form', async ({ page }) => {
  // Navigate to reset password page with a dummy token
  const dummyToken = 'dummy-token-for-testing'
  await page.goto(
    `http://localhost:3000/auth/reset-password?token=${dummyToken}`
  )

  await verifyOnResetPasswordPage(page)

  // Test empty passwords
  await clickLink(page, 'reset-password-action')

  // Should stay on reset password page with error
  await verifyOnResetPasswordPage(page)
  await verifyAlert(page, 'Password must be at least 8 characters long.')

  // Test password too short
  await fillInput(page, 'new-password-input', '1234567') // 7 characters
  await fillInput(page, 'confirm-password-input', '1234567')
  await clickLink(page, 'reset-password-action')

  await verifyOnResetPasswordPage(page)
  await verifyAlert(page, 'Password must be at least 8 characters long.')

  // Test passwords don't match
  await fillInput(page, 'new-password-input', 'password123')
  await fillInput(page, 'confirm-password-input', 'different123')
  await clickLink(page, 'reset-password-action')

  await verifyOnResetPasswordPage(page)
  await verifyAlert(page, 'Passwords do not match. Please try again.')
})

test('handles invalid/expired token gracefully', async ({ page }) => {
  // Navigate to reset password page with an invalid token
  const invalidToken = 'invalid-expired-token-12345'
  await page.goto(
    `http://localhost:3000/auth/reset-password?token=${invalidToken}`
  )

  await verifyOnResetPasswordPage(page)

  // Fill in valid passwords
  const newPassword = 'validpassword123'
  await fillInput(page, 'new-password-input', newPassword)
  await fillInput(page, 'confirm-password-input', newPassword)
  await clickLink(page, 'reset-password-action')

  // Should be redirected to forgot password page with error message
  expect(page.url()).toContain('/auth/forgot-password')
  await verifyAlert(
    page,
    'The reset link is invalid or has expired. Please request a new password reset link.'
  )
})

test('can navigate from invalid token page', async ({ page }) => {
  // Navigate to reset password page without token
  await page.goto('http://localhost:3000/auth/reset-password')
  await verifyOnInvalidTokenPage(page)

  // Test navigation to request new reset link
  await clickLink(page, 'request-new-reset-action')
  expect(page.url()).toContain('/auth/forgot-password')

  // Go back to invalid token page
  await page.goto('http://localhost:3000/auth/reset-password')
  await verifyOnInvalidTokenPage(page)

  // Test navigation back to sign-in
  await clickLink(page, 'back-to-sign-in-from-invalid')
  expect(page.url()).toContain('/auth/sign-in')
})
