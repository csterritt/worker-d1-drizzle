import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'

test.describe('Interest Sign-Up Mode: Valid Email Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('INTEREST_SIGN_UP')
  })

  test(
    'can join waitlist with valid email and get success message',
    testWithDatabase(async ({ page }) => {
      // Navigate to sign-in page first to see the "Join Waitlist" button
      await page.goto('http://localhost:3000/auth/sign-in')

      // Verify we're on the sign-in page and see the "Join Waitlist" button
      await page.waitForSelector('[data-testid="sign-in-page-banner"]')
      await page.waitForSelector('[data-testid="go-to-sign-up-button"]')

      // Verify button text is "Join Waitlist" (not "Create Account")
      const buttonText = await page.textContent(
        '[data-testid="go-to-sign-up-button"]'
      )
      if (buttonText?.trim() !== 'Join Waitlist') {
        throw new Error(
          `Expected button text "Join Waitlist", got "${buttonText}"`
        )
      }

      // Click the "Join Waitlist" button
      await clickLink(page, 'go-to-sign-up-button')

      // Verify we're on the interest sign-up page
      await page.waitForSelector('[data-testid="interest-sign-up-page-banner"]')

      // Fill in the email address
      await fillInput(
        page,
        'interest-email-input',
        'interested-user@example.com'
      )

      // Submit the form
      await clickLink(page, 'interest-submit')

      // Should be redirected to sign-in page with success message
      await verifyOnSignInPage(page)
      await verifyAlert(
        page,
        "Thanks! You've been added to our waitlist. We'll notify you when we start accepting new accounts."
      )
    })
  )

  test(
    'shows friendly message when email is already on waitlist',
    testWithDatabase(async ({ page }) => {
      // First, add an email to the waitlist
      await page.goto('http://localhost:3000/auth/interest-sign-up')
      await page.waitForSelector('[data-testid="interest-sign-up-page-banner"]')

      await fillInput(
        page,
        'interest-email-input',
        'duplicate-test@example.com'
      )
      await clickLink(page, 'interest-submit')

      // Verify success message for first submission
      await verifyOnSignInPage(page)
      await verifyAlert(
        page,
        "Thanks! You've been added to our waitlist. We'll notify you when we start accepting new accounts."
      )

      // Now try to add the same email again
      await page.goto('http://localhost:3000/auth/interest-sign-up')
      await page.waitForSelector('[data-testid="interest-sign-up-page-banner"]')

      await fillInput(
        page,
        'interest-email-input',
        'duplicate-test@example.com'
      )
      await clickLink(page, 'interest-submit')

      // Should get friendly duplicate message
      await verifyOnSignInPage(page)
      await verifyAlert(
        page,
        "Thanks! Your email is already on our waitlist. We'll notify you when we're accepting new accounts."
      )
    })
  )
})
