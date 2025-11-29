import { test, expect } from '@playwright/test'

import { isElementVisible } from '../support/finders'
import { navigateToSignIn } from '../support/navigation-helpers'

/**
 * Common sign-in page element tests that apply to all modes
 * Mode-specific sign-up button behavior is tested in each mode's directory
 */
test.describe('Sign-In Page: Common Elements', () => {
  test('sign-in page has required form elements', async ({ page }) => {
    await navigateToSignIn(page)

    // Verify core form elements are present
    expect(await isElementVisible(page, 'email-input')).toBe(true)
    expect(await isElementVisible(page, 'password-input')).toBe(true)
    expect(await isElementVisible(page, 'submit')).toBe(true)

    // Verify page title
    expect(await page.locator('h2').textContent()).toContain('Sign In')
  })

  test('sign-in page does not have sign-up form elements embedded', async ({
    page,
  }) => {
    await navigateToSignIn(page)

    // Sign-up form elements should never be on the sign-in page
    expect(await isElementVisible(page, 'signup-name-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-email-input')).toBe(false)
    expect(await isElementVisible(page, 'signup-password-input')).toBe(false)
  })

  test('sign-in page has forgot password link', async ({ page }) => {
    await navigateToSignIn(page)

    expect(await isElementVisible(page, 'forgot-password-action')).toBe(true)

    // Click forgot password link should work
    await page.click('[data-testid="forgot-password-action"]')
    expect(page.url()).toContain('/auth/forgot-password')
  })
})
