import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'

test.describe('Gated Sign-Up Mode: Invalid Code Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('GATED_SIGN_UP')
  })

  test(
    'shows error for invalid sign-up code',
    testWithDatabase(async ({ page }) => {
      // Navigate to gated sign-up page
      await page.goto('http://localhost:3000/auth/sign-up')

      // Verify we're on the gated sign-up page
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      // Fill in the form with invalid code
      await fillInput(page, 'gated-signup-code-input', 'INVALID-CODE-999')
      await fillInput(page, 'gated-signup-name-input', 'Test User')
      await fillInput(page, 'gated-signup-email-input', 'test@example.com')
      await fillInput(page, 'gated-signup-password-input', 'password123')

      // Submit the form
      await clickLink(page, 'gated-signup-submit')

      // Should stay on sign-up page with error message
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')
      await verifyAlert(
        page,
        'Invalid or expired sign-up code. Please check your code and try again.'
      )
    })
  )

  test(
    'shows error for missing sign-up code',
    testWithDatabase(async ({ page }) => {
      // Navigate to gated sign-up page
      await page.goto('http://localhost:3000/auth/sign-up')

      // Verify we're on the gated sign-up page
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      // Fill in the form without code (leave code field empty)
      await fillInput(page, 'gated-signup-name-input', 'Test User')
      await fillInput(page, 'gated-signup-email-input', 'test@example.com')
      await fillInput(page, 'gated-signup-password-input', 'password123')

      // Submit the form
      await clickLink(page, 'gated-signup-submit')

      // Should stay on sign-up page with error message
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')
      await verifyAlert(page, 'All fields are required for sign-up.')
    })
  )

  test(
    'shows error for empty/whitespace-only sign-up code',
    testWithDatabase(async ({ page }) => {
      // Navigate to gated sign-up page
      await page.goto('http://localhost:3000/auth/sign-up')

      // Verify we're on the gated sign-up page
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      // Fill in the form with whitespace-only code
      await fillInput(page, 'gated-signup-code-input', '   ')
      await fillInput(page, 'gated-signup-name-input', 'Test User')
      await fillInput(page, 'gated-signup-email-input', 'test@example.com')
      await fillInput(page, 'gated-signup-password-input', 'password123')

      // Submit the form
      await clickLink(page, 'gated-signup-submit')

      // Should stay on sign-up page with error message
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')
      await verifyAlert(page, 'All fields are required for sign-up.')
    })
  )

  test(
    'cannot reuse consumed sign-up code',
    testWithDatabase(async ({ page }) => {
      // First sign-up using a code
      await page.goto('http://localhost:3000/auth/sign-up')
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      await fillInput(page, 'gated-signup-code-input', 'TEST-CODE-789')
      await fillInput(page, 'gated-signup-name-input', 'First User')
      await fillInput(page, 'gated-signup-email-input', 'first@example.com')
      await fillInput(page, 'gated-signup-password-input', 'password123')
      await clickLink(page, 'gated-signup-submit')

      // Should succeed and redirect to await verification
      await page.waitForSelector('[data-testid="await-verification-page"]')

      // Now try to use the same code again with different email
      await page.goto('http://localhost:3000/auth/sign-up')
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')

      await fillInput(page, 'gated-signup-code-input', 'TEST-CODE-789')
      await fillInput(page, 'gated-signup-name-input', 'Second User')
      await fillInput(page, 'gated-signup-email-input', 'second@example.com')
      await fillInput(page, 'gated-signup-password-input', 'password123')
      await clickLink(page, 'gated-signup-submit')

      // Should fail with invalid code error (code was consumed)
      await page.waitForSelector('[data-testid="gated-sign-up-page-banner"]')
      await verifyAlert(
        page,
        'Invalid or expired sign-up code. Please check your code and try again.'
      )
    })
  )
})
