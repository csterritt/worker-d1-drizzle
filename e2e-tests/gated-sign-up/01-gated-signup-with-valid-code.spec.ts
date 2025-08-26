import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnAwaitVerificationPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'

test.describe('Gated Sign-Up Mode: Valid Code Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('GATED_SIGN_UP')
  })

  test(
    'can sign up with valid gated code and creates account',
    testWithDatabase(async ({ page }) => {
      // Navigate to gated sign-up page
      await page.goto('http://localhost:3000/auth/sign-up')

      // Verify we're on the gated sign-up page
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      // Fill in the gated sign-up form with valid code
      await fillInput(page, 'gated-signup-code-input', 'WELCOME2024')
      await fillInput(page, 'gated-signup-name-input', 'Gated Test User')
      await fillInput(
        page,
        'gated-signup-email-input',
        'gated-test@example.com'
      )
      await fillInput(page, 'gated-signup-password-input', 'securepassword123')

      // Submit the form
      await clickLink(page, 'gated-signup-submit')

      // Wait a bit for any redirects to complete
      await page.waitForTimeout(2000)

      // Should be redirected to the await verification page
      await verifyOnAwaitVerificationPage(page)

      // Should see the email confirmation message
    })
  )

  test(
    'handles duplicate email properly for gated sign-up',
    testWithDatabase(async ({ page }) => {
      // First, complete a successful sign-up
      await page.goto('http://localhost:3000/auth/sign-up')
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      await fillInput(page, 'gated-signup-code-input', 'BETA-ACCESS-123')
      await fillInput(page, 'gated-signup-name-input', 'First User')
      await fillInput(page, 'gated-signup-email-input', 'duplicate@example.com')
      await fillInput(page, 'gated-signup-password-input', 'password123')
      await clickLink(page, 'gated-signup-submit')
      await verifyOnAwaitVerificationPage(page)

      // Now try to sign up again with the same email but different code
      await page.goto('http://localhost:3000/auth/sign-up')
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      await fillInput(page, 'gated-signup-code-input', 'EARLY-BIRD-456')
      await fillInput(page, 'gated-signup-name-input', 'Second User')
      await fillInput(page, 'gated-signup-email-input', 'duplicate@example.com')
      await fillInput(page, 'gated-signup-password-input', 'differentpassword')
      await clickLink(page, 'gated-signup-submit')

      // Should be redirected to await verification with message about existing account
      await verifyOnAwaitVerificationPage(page)
      await verifyAlert(
        page,
        'An account with this email already exists. Please check your email for a verification link or sign in if you have already verified your account.'
      )
    })
  )
})
