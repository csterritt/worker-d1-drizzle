import { test, expect } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnGatedSignUpPage,
} from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  navigateToSignIn,
  navigateToGatedSignUp,
} from '../support/navigation-helpers'

test.describe('Gated Sign-Up Mode: Page Navigation Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('GATED_SIGN_UP')
  })

  test('sign-in page shows Create Account button', async ({ page }) => {
    await navigateToSignIn(page)
    expect(await isElementVisible(page, 'go-to-sign-up-action')).toBe(true)
    const buttonText = await page
      .locator('[data-testid="go-to-sign-up-action"]')
      .textContent()
    expect(buttonText).toContain('Create Account')
  })

  test('can navigate between sign-in and gated sign-up pages', async ({
    page,
  }) => {
    await navigateToSignIn(page)

    await clickLink(page, 'go-to-sign-up-action')
    await verifyOnGatedSignUpPage(page)
    expect(page.url()).toContain('/auth/sign-up')

    await clickLink(page, 'go-to-sign-in-action')
    await verifyOnSignInPage(page)
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('gated sign-up page has correct form elements', async ({ page }) => {
    await navigateToGatedSignUp(page)

    expect(await isElementVisible(page, 'gated-signup-name-input')).toBe(true)
    expect(await isElementVisible(page, 'gated-signup-email-input')).toBe(true)
    expect(await isElementVisible(page, 'gated-signup-password-input')).toBe(
      true
    )
    expect(await isElementVisible(page, 'gated-signup-code-input')).toBe(true)
    expect(await isElementVisible(page, 'gated-signup-action')).toBe(true)
    expect(await isElementVisible(page, 'go-to-sign-in-action')).toBe(true)
    expect(await page.locator('h2').textContent()).toContain('Create Account')
  })
})
