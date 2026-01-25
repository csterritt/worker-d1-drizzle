import { test, expect } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnSignUpPage,
} from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  navigateToSignIn,
  navigateToSignUp,
} from '../support/navigation-helpers'

test.describe('Open Sign-Up Mode: Page Navigation Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('OPEN_SIGN_UP')
  })

  test('sign-in page shows Create Account button', async ({ page }) => {
    await navigateToSignIn(page)
    expect(await isElementVisible(page, 'go-to-sign-up-action')).toBe(true)
    const buttonText = await page
      .locator('[data-testid="go-to-sign-up-action"]')
      .textContent()
    expect(buttonText).toContain('Create Account')
  })

  test('can navigate between sign-in and sign-up pages', async ({ page }) => {
    await navigateToSignIn(page)

    await clickLink(page, 'go-to-sign-up-action')
    await verifyOnSignUpPage(page)
    expect(page.url()).toContain('/auth/sign-up')

    await clickLink(page, 'go-to-sign-in-action')
    await verifyOnSignInPage(page)
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('sign-up page has correct form elements', async ({ page }) => {
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // Verify form elements are present
    expect(await isElementVisible(page, 'signup-name-input')).toBe(true)
    expect(await isElementVisible(page, 'signup-email-input')).toBe(true)
    expect(await isElementVisible(page, 'signup-password-input')).toBe(true)
    expect(await isElementVisible(page, 'signup-action')).toBe(true)
    expect(await isElementVisible(page, 'go-to-sign-in-action')).toBe(true)
    // Verify page title
    expect(await page.locator('h2').textContent()).toContain('Create Account')
  })

  test('sign-in page has correct form elements and navigation', async ({
    page,
  }) => {
    // Navigate to sign-in page
    await navigateToSignIn(page)

    // Verify all form elements are present
    expect(await isElementVisible(page, 'email-input')).toBe(true)
    expect(await isElementVisible(page, 'password-input')).toBe(true)
    expect(await isElementVisible(page, 'submit')).toBe(true)

    // In OPEN_SIGN_UP mode, the sign-up button should be visible
    expect(await isElementVisible(page, 'go-to-sign-up-action')).toBe(true)

    // Verify page title
    expect(await page.locator('h2').textContent()).toContain('Sign In')

    // Verify that sign-up form elements are NOT present (since we separated them)
    expect(await isElementVisible(page, 'signup-name-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-email-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-password-input')).toBe(false)
  })
})
