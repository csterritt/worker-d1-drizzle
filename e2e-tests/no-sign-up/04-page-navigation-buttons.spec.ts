import { test, expect } from '@playwright/test'

import { isElementVisible } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  navigateToSignIn,
  navigateTo404Route,
} from '../support/navigation-helpers'

test.describe('No Sign-Up Mode: Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('NO_SIGN_UP')
  })

  test('sign-in page has correct form elements without sign-up navigation', async ({
    page,
  }) => {
    // Navigate to sign-in page
    await navigateToSignIn(page)

    // Verify all form elements are present
    expect(await isElementVisible(page, 'email-input')).toBe(true)
    expect(await isElementVisible(page, 'password-input')).toBe(true)
    expect(await isElementVisible(page, 'submit')).toBe(true)

    // In NO_SIGN_UP mode, the sign-up button should NOT be visible
    expect(
      await page.locator('[data-testid="go-to-sign-up-action"]').count()
    ).toBe(0)

    // Verify page title
    expect(await page.locator('h2').textContent()).toContain('Sign In')

    // Verify that sign-up form elements are NOT present
    expect(await isElementVisible(page, 'signup-name-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-email-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-password-input')).toBe(false)
  })

  test('sign-up URL returns 404 page', async ({ page }) => {
    // Attempt to visit sign-up page directly
    await navigateTo404Route(page, '/auth/sign-up')
  })

  test('interest sign-up URL returns 404 page', async ({ page }) => {
    // Attempt to visit interest sign-up page directly
    await navigateTo404Route(page, '/auth/interest-sign-up')
  })

  test('forgot password functionality still works', async ({ page }) => {
    // Navigate to sign-in page
    await navigateToSignIn(page)

    // Verify forgot password link is still present
    expect(await isElementVisible(page, 'forgot-password-action')).toBe(true)

    // Click forgot password link should work
    await page.click('[data-testid="forgot-password-action"]')

    // Should be on forgot password page
    expect(page.url()).toContain('/auth/forgot-password')
  })
})
