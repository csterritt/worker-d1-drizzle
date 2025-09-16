import { test, expect } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnInterestSignUpPage,
} from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  navigateToSignIn,
  navigateToInterestSignUp,
} from '../support/navigation-helpers'

test.describe('Interest Sign-Up Mode: Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('INTEREST_SIGN_UP')
  })

  test('can navigate between sign-in and interest sign-up pages using buttons', async ({
    page,
  }) => {
    // Start on the sign-in page
    await navigateToSignIn(page)

    // Click the "Join Waitlist" button to go to interest sign-up page
    await clickLink(page, 'go-to-sign-up-action')
    await verifyOnInterestSignUpPage(page)

    // Verify we're on the correct URL
    expect(page.url()).toContain('/auth/interest-sign-up')

    // Click the "Sign In Instead" button to go back to sign-in page
    await clickLink(page, 'go-to-sign-in-action')
    await verifyOnSignInPage(page)

    // Verify we're back on the correct URL
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('interest sign-up page has correct form elements and navigation', async ({
    page,
  }) => {
    // Navigate directly to interest sign-up page
    await navigateToInterestSignUp(page)

    // Verify form elements are present (interest sign-up specific test IDs)
    expect(await isElementVisible(page, 'interest-email-input')).toBe(true)
    expect(await isElementVisible(page, 'interest-action')).toBe(true)
    expect(await isElementVisible(page, 'go-to-sign-in-action')).toBe(true)

    // Verify page banner and content
    expect(await isElementVisible(page, 'interest-sign-up-page-banner')).toBe(
      true
    )

    // Verify page title/heading
    expect(await page.locator('h2').textContent()).toContain(
      'Join the Waitlist'
    )
  })

  test('sign-in page has correct form elements and navigation for waitlist mode', async ({
    page,
  }) => {
    // Navigate to sign-in page
    await navigateToSignIn(page)

    // Verify all form elements are present
    expect(await isElementVisible(page, 'email-input')).toBe(true)
    expect(await isElementVisible(page, 'password-input')).toBe(true)
    expect(await isElementVisible(page, 'submit')).toBe(true)

    // In INTEREST_SIGN_UP mode, the button should say "Join Waitlist"
    expect(await isElementVisible(page, 'go-to-sign-up-action')).toBe(true)
    const buttonText = await page
      .locator('[data-testid="go-to-sign-up-action"]')
      .textContent()
    expect(buttonText).toContain('Join Waitlist')

    // Verify page title
    expect(await page.locator('h2').textContent()).toContain('Sign In')

    // Verify that regular sign-up form elements are NOT present
    expect(await isElementVisible(page, 'signup-name-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-email-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-password-input')).toBe(false)
  })
})
