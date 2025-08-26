import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnInterestSignUpPage } from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'

test.describe('Interest Sign-Up Mode: Email Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('INTEREST_SIGN_UP')
  })

  test('shows error for empty email submission', async ({ page }) => {
    // Navigate to interest sign-up page
    await page.goto('http://localhost:3000/auth/interest-sign-up')
    await page.waitForSelector('[data-testid="interest-sign-up-page-banner"]')

    // Submit without entering email
    await clickLink(page, 'interest-submit')

    // Should stay on the same page with error message
    await verifyOnInterestSignUpPage(page)
    await verifyAlert(page, 'Email address is required.')
  })

  test('shows error for invalid email format', async ({ page }) => {
    // Navigate to interest sign-up page
    await page.goto('http://localhost:3000/auth/interest-sign-up')
    await page.waitForSelector('[data-testid="interest-sign-up-page-banner"]')

    // Enter invalid email
    await fillInput(page, 'interest-email-input', 'invalid-email-format')
    await clickLink(page, 'interest-submit')

    // Should stay on the same page with error message
    await verifyOnInterestSignUpPage(page)
    await verifyAlert(page, 'Please enter a valid email address.')
  })

  test('shows error for malformed email', async ({ page }) => {
    // Navigate to interest sign-up page
    await page.goto('http://localhost:3000/auth/interest-sign-up')
    await page.waitForSelector('[data-testid="interest-sign-up-page-banner"]')

    // Enter malformed email
    await fillInput(page, 'interest-email-input', 'test@')
    await clickLink(page, 'interest-submit')

    // Should stay on the same page with error message
    await verifyOnInterestSignUpPage(page)
    await verifyAlert(page, 'Please enter a valid email address.')
  })

  test('accepts valid email with various formats', async ({ page }) => {
    const validEmails = [
      'test.user+tag@example.com',
      'user_name@subdomain.example.org',
      'simple@test.co',
    ]

    for (const email of validEmails) {
      // Navigate to interest sign-up page
      await page.goto('http://localhost:3000/auth/interest-sign-up')
      await page.waitForSelector('[data-testid="interest-sign-up-page-banner"]')

      // Enter valid email
      await fillInput(page, 'interest-email-input', email)
      await clickLink(page, 'interest-submit')

      // Should redirect to sign-in page with success message
      await page.waitForSelector('[data-testid="sign-in-page-banner"]')
      await verifyAlert(
        page,
        "Thanks! You've been added to our waitlist. We'll notify you when we start accepting new accounts."
      )
    }
  })
})
