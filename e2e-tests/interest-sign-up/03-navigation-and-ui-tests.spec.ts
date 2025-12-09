import { test, expect } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnInterestSignUpPage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import {
  skipIfNotExactMode,
  skipIfNotMode,
  detectSignUpMode,
} from '../support/mode-helpers'
import { signInUser } from '../support/auth-helpers'
import { testWithDatabase } from '../support/test-helpers'
import {
  navigateToInterestSignUp,
  navigateToHome,
} from '../support/navigation-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

/**
 * Tests specific to INTEREST_SIGN_UP mode UI
 * These should NOT run in BOTH_SIGN_UP mode which has different UI
 */
test.describe('Interest Sign-Up Mode: UI Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotExactMode('INTEREST_SIGN_UP')
  })

  test('interest sign-up page shows explanatory text', async ({ page }) => {
    await navigateToInterestSignUp(page)

    const explanation = page.getByTestId('no-new-accounts-message')
    await expect(explanation).toContainText(
      "We're not accepting new accounts at the moment"
    )
  })

  test('interest sign-up page has correct button texts', async ({ page }) => {
    await navigateToInterestSignUp(page)

    await expect(page.locator('[data-testid="interest-action"]')).toHaveText(
      'Join Waitlist'
    )
    await expect(
      page.locator('[data-testid="go-to-sign-in-action"]')
    ).toHaveText('Sign In Instead')
  })
})

/**
 * Behavior tests that work in both INTEREST_SIGN_UP and BOTH_SIGN_UP modes
 */
test.describe('Interest Sign-Up Mode: Behavior Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('INTEREST_SIGN_UP')
  })

  test(
    'redirects to protected page when already authenticated',
    testWithDatabase(async ({ page }) => {
      await navigateToHome(page)
      await signInUser(
        page,
        TEST_USERS.KNOWN_USER.email,
        TEST_USERS.KNOWN_USER.password
      )
      await verifyOnProtectedPage(page)

      // Try to navigate to interest sign-up page while authenticated
      const mode = await detectSignUpMode()
      const url =
        mode === 'INTEREST_SIGN_UP'
          ? BASE_URLS.INTEREST_SIGN_UP
          : BASE_URLS.SIGN_UP
      await page.goto(url)

      // Should be redirected back to protected page
      await verifyOnProtectedPage(page)
      expect(page.url()).toContain('/private')
    })
  )

  test('preserves email in form when validation fails', async ({ page }) => {
    await navigateToInterestSignUp(page)

    const invalidEmail = 'invalid-email'
    await fillInput(page, 'interest-email-input', invalidEmail)
    await clickLink(page, 'interest-action')

    await verifyOnInterestSignUpPage(page)
    await verifyAlert(page, 'Please enter a valid email address.')

    const emailInput = page.locator('[data-testid="interest-email-input"]')
    await expect(emailInput).toHaveValue(invalidEmail)
  })
})
