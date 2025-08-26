import { test, expect } from '@playwright/test'

import { isElementVisible } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'

test.describe('No Sign-Up Mode: Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('NO_SIGN_UP')
  })

  test('sign-in page has correct form elements without sign-up navigation', async ({
    page,
  }) => {
    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/sign-in')
    await verifyOnSignInPage(page)

    // Verify all form elements are present
    expect(await isElementVisible(page, 'email-input')).toBe(true)
    expect(await isElementVisible(page, 'password-input')).toBe(true)
    expect(await isElementVisible(page, 'submit')).toBe(true)

    // In NO_SIGN_UP mode, the sign-up button should NOT be visible
    expect(
      await page.locator('[data-testid="go-to-sign-up-button"]').count()
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
    await page.goto('http://localhost:3000/auth/sign-up')

    // Should be on a 404 page
    expect(await page.locator('.text-error').textContent()).toContain('404')
  })

  test('interest sign-up URL returns 404 page', async ({ page }) => {
    // Attempt to visit interest sign-up page directly
    await page.goto('http://localhost:3000/auth/interest-sign-up')

    // Should be on a 404 page
    expect(await page.locator('.text-error').textContent()).toContain('404')
  })

  test('forgot password functionality still works', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/sign-in')
    await verifyOnSignInPage(page)

    // Verify forgot password link is still present
    expect(await isElementVisible(page, 'forgot-password-link')).toBe(true)

    // Click forgot password link should work
    await page.click('[data-testid="forgot-password-link"]')

    // Should be on forgot password page
    expect(page.url()).toContain('/auth/forgot-password')
  })
})
