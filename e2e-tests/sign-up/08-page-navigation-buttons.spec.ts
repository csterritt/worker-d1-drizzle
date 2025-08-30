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
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
  })

  test('can navigate between sign-in and sign-up pages using buttons', async ({
    page,
  }) => {
    // Start on the sign-in page
    await navigateToSignIn(page)

    // Click the "Create Account" button to go to sign-up page
    await clickLink(page, 'go-to-sign-up-button')
    await verifyOnSignUpPage(page)

    // Verify we're on the correct URL
    expect(page.url()).toContain('/auth/sign-up')

    // Click the "Sign In Instead" button to go back to sign-in page
    await clickLink(page, 'go-to-sign-in-button')
    await verifyOnSignInPage(page)

    // Verify we're back on the correct URL
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('sign-up page has correct form elements and navigation', async ({
    page,
  }) => {
    // Navigate directly to sign-up page
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // Verify form elements are present
    expect(await isElementVisible(page, 'signup-name-input')).toBe(true)
    expect(await isElementVisible(page, 'signup-email-input')).toBe(true)
    expect(await isElementVisible(page, 'signup-password-input')).toBe(true)
    expect(await isElementVisible(page, 'signup-submit')).toBe(true)
    expect(await isElementVisible(page, 'go-to-sign-in-button')).toBe(true)

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
    expect(await isElementVisible(page, 'go-to-sign-up-button')).toBe(true)

    // Verify page title
    expect(await page.locator('h2').textContent()).toContain('Sign In')

    // Verify that sign-up form elements are NOT present (since we separated them)
    expect(await isElementVisible(page, 'signup-name-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-email-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-password-input')).toBe(false)
  })
})
