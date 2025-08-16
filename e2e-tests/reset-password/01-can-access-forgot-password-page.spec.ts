import { expect, test } from '@playwright/test'

import { clickLink } from '../support/finders'
import {
  verifyOnForgotPasswordPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'

test('can access forgot password page from sign-in page', async ({ page }) => {
  // Start on the sign-in page
  await page.goto('http://localhost:3000/auth/sign-in')
  await verifyOnSignInPage(page)

  // Click the "Forgot your password?" link
  await clickLink(page, 'forgot-password-link')
  await verifyOnForgotPasswordPage(page)

  // Verify we're on the correct URL
  expect(page.url()).toContain('/auth/forgot-password')

  // Verify all form elements are present
  expect(
    await page.locator('[data-testid="forgot-email-input"]').isVisible()
  ).toBe(true)
  expect(
    await page.locator('[data-testid="forgot-password-submit"]').isVisible()
  ).toBe(true)
  expect(
    await page.locator('[data-testid="back-to-sign-in-button"]').isVisible()
  ).toBe(true)

  // Verify page title
  expect(await page.locator('h2').textContent()).toContain(
    'Reset Your Password'
  )
})

test('can navigate back to sign-in from forgot password page', async ({
  page,
}) => {
  // Navigate directly to forgot password page
  await page.goto('http://localhost:3000/auth/forgot-password')
  await verifyOnForgotPasswordPage(page)

  // Click the "Back to Sign In" button
  await clickLink(page, 'back-to-sign-in-button')
  await verifyOnSignInPage(page)

  // Verify we're back on the correct URL
  expect(page.url()).toContain('/auth/sign-in')
})
