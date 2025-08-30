import { test } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnInterestSignUpPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToInterestSignUp } from '../support/navigation-helpers'
import { submitInterestSignUpForm } from '../support/form-helpers'
import {
  testRequiredEmailField,
  testEmailValidation,
  testInterestSignUpFormValidation,
} from '../support/validation-helpers'

test.describe('Interest Sign-Up Mode: Email Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('INTEREST_SIGN_UP')
  })

  test('shows error for empty email submission', async ({ page }) => {
    await navigateToInterestSignUp(page)
    await testRequiredEmailField(page, 'interest-submit')
  })

  test('shows error for invalid email format', async ({ page }) => {
    await navigateToInterestSignUp(page)
    await testEmailValidation(page, 'interest-email-input', 'interest-submit')
  })

  test('comprehensive form validation', async ({ page }) => {
    await navigateToInterestSignUp(page)
    await testInterestSignUpFormValidation(page)
    await fillInput(page, 'interest-email-input', 'invalid-email-format')
    await clickLink(page, 'interest-submit')

    // Should stay on the same page with error message
    await verifyOnInterestSignUpPage(page)
    await verifyAlert(page, 'Please enter a valid email address.')
  })

  test('shows error for malformed email', async ({ page }) => {
    // Navigate to interest sign-up page
    await navigateToInterestSignUp(page)

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
      // Navigate and submit with helper
      await navigateToInterestSignUp(page)
      await submitInterestSignUpForm(page, email)

      // Should redirect to sign-in page with success message
      await verifyOnSignInPage(page)
      await verifyAlert(
        page,
        "Thanks! You've been added to our waitlist. We'll notify you when we start accepting new accounts."
      )
    }
  })
})
