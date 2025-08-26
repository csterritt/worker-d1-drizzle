import { test, expect } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { detectSignUpMode } from '../support/mode-helpers'

/**
 * Helper function to verify we're on the sign-up page
 * Handles both regular and gated sign-up page banners
 */
async function verifyOnASignUpPage(page: any) {
  // Check for either regular sign-up banner or gated sign-up banner
  const regularVisible = await isElementVisible(page, 'sign-up-page-banner')
  const gatedVisible = await isElementVisible(page, 'gated-sign-up-page-banner')

  expect(regularVisible || gatedVisible).toBe(true)
}

test('can navigate between sign-in and sign-up pages using buttons', async ({
  page,
}) => {
  const currentMode = await detectSignUpMode()
  if (currentMode === 'NO_SIGN_UP') {
    // Skip this test in NO_SIGN_UP mode since there's no sign-up navigation
    return
  }

  // Start on the sign-in page
  await page.goto('http://localhost:3000/auth/sign-in')
  await verifyOnSignInPage(page)

  // Click the "Create Account" button to go to sign-up page
  await clickLink(page, 'go-to-sign-up-button')
  await verifyOnASignUpPage(page)

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
  const currentMode = await detectSignUpMode()
  if (currentMode === 'NO_SIGN_UP') {
    // Skip this test in NO_SIGN_UP mode since sign-up page doesn't exist
    return
  }

  // Navigate directly to sign-up page
  await page.goto('http://localhost:3000/auth/sign-up')
  await verifyOnASignUpPage(page)

  // Verify common form elements that exist in both modes
  // Check for both regular and gated form element test IDs
  const nameInput =
    (await isElementVisible(page, 'signup-name-input')) ||
    (await isElementVisible(page, 'gated-signup-name-input'))
  const emailInput =
    (await isElementVisible(page, 'signup-email-input')) ||
    (await isElementVisible(page, 'gated-signup-email-input'))
  const passwordInput =
    (await isElementVisible(page, 'signup-password-input')) ||
    (await isElementVisible(page, 'gated-signup-password-input'))
  const submitButton =
    (await isElementVisible(page, 'signup-submit')) ||
    (await isElementVisible(page, 'gated-signup-submit'))

  expect(nameInput).toBe(true)
  expect(emailInput).toBe(true)
  expect(passwordInput).toBe(true)
  expect(submitButton).toBe(true)
  expect(await isElementVisible(page, 'go-to-sign-in-button')).toBe(true)

  // In GATED_SIGN_UP mode, there should also be a sign-up code field
  if (currentMode === 'GATED_SIGN_UP') {
    expect(await isElementVisible(page, 'gated-signup-code-input')).toBe(true)
  }

  // Verify page title
  expect(await page.locator('h2').textContent()).toContain('Create Account')
})

test('sign-in page has correct form elements and navigation', async ({
  page,
}) => {
  // Navigate to sign-in page
  await page.goto('http://localhost:3000/auth/sign-in')
  await verifyOnSignInPage(page)

  // Verify all form elements are present
  expect(await isElementVisible(page, 'email-input')).toBe(true)
  expect(await isElementVisible(page, 'password-input')).toBe(true)
  expect(await isElementVisible(page, 'submit')).toBe(true)

  // Check sign-up button visibility based on current mode
  const currentMode = await detectSignUpMode()
  if (currentMode === 'OPEN_SIGN_UP' || currentMode === 'GATED_SIGN_UP') {
    // In both OPEN_SIGN_UP and GATED_SIGN_UP modes, the sign-up button should be visible
    expect(await isElementVisible(page, 'go-to-sign-up-button')).toBe(true)
  } else {
    // In NO_SIGN_UP mode, the sign-up button should be hidden
    expect(
      await page.locator('[data-testid="go-to-sign-up-button"]').count()
    ).toBe(0)
  }

  // Verify page title
  expect(await page.locator('h2').textContent()).toContain('Sign In')

  // Verify that sign-up form elements are NOT present (since we separated them)
  expect(await isElementVisible(page, 'signup-name-input')).toBe(false)
  expect(await isElementVisible(page, 'signup-email-input')).toBe(false)
  expect(await isElementVisible(page, 'signup-password-input')).toBe(false)
})
