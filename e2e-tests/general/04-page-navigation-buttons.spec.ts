import { test, expect } from '@playwright/test'

import { clickLink } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'

/**
 * Helper function to verify we're on the sign-up page
 */
async function verifyOnSignUpPage(page: any) {
  expect(await page.locator('[data-testid="sign-up-page-banner"]').isVisible()).toBe(true)
}

test('can navigate between sign-in and sign-up pages using buttons', async ({ page }) => {
  // Start on the sign-in page
  await page.goto('http://localhost:3000/auth/sign-in')
  await verifyOnSignInPage(page)

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

test('sign-up page has correct form elements and navigation', async ({ page }) => {
  // Navigate directly to sign-up page
  await page.goto('http://localhost:3000/auth/sign-up')
  await verifyOnSignUpPage(page)

  // Verify all form elements are present
  expect(await page.locator('[data-testid="signup-name-input"]').isVisible()).toBe(true)
  expect(await page.locator('[data-testid="signup-email-input"]').isVisible()).toBe(true)
  expect(await page.locator('[data-testid="signup-password-input"]').isVisible()).toBe(true)
  expect(await page.locator('[data-testid="signup-submit"]').isVisible()).toBe(true)
  expect(await page.locator('[data-testid="go-to-sign-in-button"]').isVisible()).toBe(true)

  // Verify page title
  expect(await page.locator('h2').textContent()).toContain('Create Account')
})

test('sign-in page has correct form elements and navigation', async ({ page }) => {
  // Navigate to sign-in page
  await page.goto('http://localhost:3000/auth/sign-in')
  await verifyOnSignInPage(page)

  // Verify all form elements are present
  expect(await page.locator('[data-testid="email-input"]').isVisible()).toBe(true)
  expect(await page.locator('[data-testid="password-input"]').isVisible()).toBe(true)
  expect(await page.locator('[data-testid="submit"]').isVisible()).toBe(true)
  expect(await page.locator('[data-testid="go-to-sign-up-button"]').isVisible()).toBe(true)

  // Verify page title
  expect(await page.locator('h2').textContent()).toContain('Sign In')

  // Verify that sign-up form elements are NOT present (since we separated them)
  expect(await page.locator('[data-testid="signup-name-input"]').isVisible()).toBe(false)
  expect(await page.locator('[data-testid="signup-email-input"]').isVisible()).toBe(false)
  expect(await page.locator('[data-testid="signup-password-input"]').isVisible()).toBe(false)
})
