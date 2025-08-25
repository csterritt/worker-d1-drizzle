import { test, expect } from '@playwright/test'

import { clickLink } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { detectSignUpMode } from '../support/mode-helpers'

/**
 * Helper function to verify we're on the sign-up page
 * Handles both regular and gated sign-up page banners
 */
async function verifyOnSignUpPage(page: any) {
  // Check for either regular sign-up banner or gated sign-up banner
  const regularBanner = page.locator('[data-testid="sign-up-page-banner"]')
  const gatedBanner = page.locator('[data-testid="gated-sign-up-page-banner"]')

  const regularVisible = await regularBanner.isVisible().catch(() => false)
  const gatedVisible = await gatedBanner.isVisible().catch(() => false)

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
  const currentMode = await detectSignUpMode()
  if (currentMode === 'NO_SIGN_UP') {
    // Skip this test in NO_SIGN_UP mode since sign-up page doesn't exist
    return
  }

  // Navigate directly to sign-up page
  await page.goto('http://localhost:3000/auth/sign-up')
  await verifyOnSignUpPage(page)

  // Verify common form elements that exist in both modes
  // Check for both regular and gated form element test IDs
  const nameInput =
    (await page
      .locator('[data-testid="signup-name-input"]')
      .isVisible()
      .catch(() => false)) ||
    (await page
      .locator('[data-testid="gated-signup-name-input"]')
      .isVisible()
      .catch(() => false))
  const emailInput =
    (await page
      .locator('[data-testid="signup-email-input"]')
      .isVisible()
      .catch(() => false)) ||
    (await page
      .locator('[data-testid="gated-signup-email-input"]')
      .isVisible()
      .catch(() => false))
  const passwordInput =
    (await page
      .locator('[data-testid="signup-password-input"]')
      .isVisible()
      .catch(() => false)) ||
    (await page
      .locator('[data-testid="gated-signup-password-input"]')
      .isVisible()
      .catch(() => false))
  const submitButton =
    (await page
      .locator('[data-testid="signup-submit"]')
      .isVisible()
      .catch(() => false)) ||
    (await page
      .locator('[data-testid="gated-signup-submit"]')
      .isVisible()
      .catch(() => false))

  expect(nameInput).toBe(true)
  expect(emailInput).toBe(true)
  expect(passwordInput).toBe(true)
  expect(submitButton).toBe(true)
  expect(
    await page.locator('[data-testid="go-to-sign-in-button"]').isVisible()
  ).toBe(true)

  // In GATED_SIGN_UP mode, there should also be a sign-up code field
  if (currentMode === 'GATED_SIGN_UP') {
    expect(
      await page.locator('[data-testid="gated-signup-code-input"]').isVisible()
    ).toBe(true)
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
  expect(await page.locator('[data-testid="email-input"]').isVisible()).toBe(
    true
  )
  expect(await page.locator('[data-testid="password-input"]').isVisible()).toBe(
    true
  )
  expect(await page.locator('[data-testid="submit"]').isVisible()).toBe(true)

  // Check sign-up button visibility based on current mode
  const currentMode = await detectSignUpMode()
  if (currentMode === 'OPEN_SIGN_UP' || currentMode === 'GATED_SIGN_UP') {
    // In both OPEN_SIGN_UP and GATED_SIGN_UP modes, the sign-up button should be visible
    expect(
      await page.locator('[data-testid="go-to-sign-up-button"]').isVisible()
    ).toBe(true)
  } else {
    // In NO_SIGN_UP mode, the sign-up button should be hidden
    expect(
      await page.locator('[data-testid="go-to-sign-up-button"]').count()
    ).toBe(0)
  }

  // Verify page title
  expect(await page.locator('h2').textContent()).toContain('Sign In')

  // Verify that sign-up form elements are NOT present (since we separated them)
  expect(
    await page.locator('[data-testid="signup-name-input"]').isVisible()
  ).toBe(false)
  expect(
    await page.locator('[data-testid="signup-email-input"]').isVisible()
  ).toBe(false)
  expect(
    await page.locator('[data-testid="signup-password-input"]').isVisible()
  ).toBe(false)
})
