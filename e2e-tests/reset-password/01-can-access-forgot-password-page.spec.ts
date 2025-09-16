import { expect, test } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import {
  verifyOnForgotPasswordPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import {
  navigateToSignIn,
  navigateToForgotPassword,
} from '../support/navigation-helpers'

test('can access forgot password page from sign-in page', async ({ page }) => {
  // Start on the sign-in page
  await navigateToSignIn(page)

  // Click the "Forgot your password?" link
  await clickLink(page, 'forgot-password-action')
  await verifyOnForgotPasswordPage(page)

  // Verify we're on the correct URL
  expect(page.url()).toContain('/auth/forgot-password')

  // Verify all form elements are present
  expect(await isElementVisible(page, 'forgot-email-input')).toBe(true)
  expect(await isElementVisible(page, 'forgot-password-action')).toBe(true)
  expect(await isElementVisible(page, 'back-to-sign-in-action')).toBe(true)

  // Verify page title
  expect(await page.locator('h2').textContent()).toContain(
    'Reset Your Password'
  )
})

test('can navigate back to sign-in from forgot password page', async ({
  page,
}) => {
  // Navigate directly to forgot password page
  await navigateToForgotPassword(page)

  // Click the "Back to Sign In" button
  await clickLink(page, 'back-to-sign-in-action')
  await verifyOnSignInPage(page)

  // Verify we're back on the correct URL
  expect(page.url()).toContain('/auth/sign-in')
})
