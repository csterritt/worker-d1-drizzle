import { test, expect } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnInterestSignUpPage,
} from '../support/page-verifiers'
import { skipIfNotExactMode } from '../support/mode-helpers'
import {
  navigateToSignIn,
  navigateToInterestSignUp,
} from '../support/navigation-helpers'

/**
 * These tests are specific to INTEREST_SIGN_UP mode UI
 * They should NOT run in BOTH_SIGN_UP mode which has different UI
 */
test.describe('Interest Sign-Up Mode: Page Navigation Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotExactMode('INTEREST_SIGN_UP')
  })

  test('sign-in page shows Join Waitlist button', async ({ page }) => {
    await navigateToSignIn(page)
    expect(await isElementVisible(page, 'go-to-sign-up-action')).toBe(true)
    const buttonText = await page
      .locator('[data-testid="go-to-sign-up-action"]')
      .textContent()
    expect(buttonText).toContain('Join Waitlist')
  })

  test('can navigate between sign-in and interest sign-up pages', async ({
    page,
  }) => {
    await navigateToSignIn(page)

    await clickLink(page, 'go-to-sign-up-action')
    await verifyOnInterestSignUpPage(page)

    await clickLink(page, 'go-to-sign-in-action')
    await verifyOnSignInPage(page)
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('interest sign-up page has correct form elements', async ({ page }) => {
    await navigateToInterestSignUp(page)

    expect(await isElementVisible(page, 'interest-email-input')).toBe(true)
    expect(await isElementVisible(page, 'interest-action')).toBe(true)
    expect(await isElementVisible(page, 'go-to-sign-in-action')).toBe(true)
    expect(await isElementVisible(page, 'sign-up-page-banner')).toBe(true)
    expect(await page.locator('h2').textContent()).toContain(
      'Join the Waitlist'
    )
  })
})
