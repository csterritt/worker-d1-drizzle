import { test, expect } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import {
  verifyOnForgotPasswordPage,
  verifyOnResetPasswordPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { navigateToForgotPassword } from '../support/navigation-helpers'

test('waiting for reset page has correct navigation options', async ({
  page,
}) => {
  // Navigate directly to waiting for reset page (should redirect to forgot password without email cookie)
  await page.goto('http://localhost:3000/auth/waiting-for-reset')

  // Should be redirected to forgot password page
  await verifyOnForgotPasswordPage(page)
  expect(page.url()).toContain('/auth/forgot-password')
})

test('reset password page navigation works correctly', async ({ page }) => {
  // Navigate to reset password page with token
  const testToken = 'test-token-123'
  await page.goto(
    `http://localhost:3000/auth/reset-password?token=${testToken}`
  )
  await verifyOnResetPasswordPage(page)

  // Navigate back to sign-in
  await clickLink(page, 'back-to-sign-in-from-reset')
  await verifyOnSignInPage(page)
  expect(page.url()).toContain('/auth/sign-in')
})

test('can access forgot password page directly', async ({ page }) => {
  // Navigate directly to forgot password page
  await navigateToForgotPassword(page)

  // Verify page loads correctly
  expect(await page.locator('h2').textContent()).toContain(
    'Reset Your Password'
  )
  expect(await isElementVisible(page, 'forgot-email-input')).toBe(true)
})

test('reset password page shows correct content with token', async ({
  page,
}) => {
  // Navigate to reset password page with token
  const testToken = 'test-token-456'
  await page.goto(
    `http://localhost:3000/auth/reset-password?token=${testToken}`
  )
  await verifyOnResetPasswordPage(page)

  // Verify page content
  expect(await page.locator('h2').textContent()).toContain('Set New Password')
  expect(await isElementVisible(page, 'new-password-input')).toBe(true)
  expect(await isElementVisible(page, 'confirm-password-input')).toBe(true)
  expect(await isElementVisible(page, 'reset-password-action')).toBe(true)

  // Verify the token is included in the hidden form field
  const tokenInput = page.locator('input[name="token"]')
  expect(await tokenInput.getAttribute('value')).toBe(testToken)
})
