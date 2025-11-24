import { test } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToGatedSignUp } from '../support/navigation-helpers'
import {
  submitGatedSignUpForm,
  fillGatedSignUpFormPartial,
} from '../support/form-helpers'
import {
  verifyOnGatedSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'

test.describe('Gated Sign-Up Mode: Invalid Code Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('GATED_SIGN_UP')
  })

  test(
    'shows error for invalid sign-up code',
    testWithDatabase(async ({ page }) => {
      // Navigate to gated sign-up page and submit form with invalid code
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: 'INVALID-CODE-999',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })

      // Should stay on sign-up page with error message
      await verifyOnGatedSignUpPage(page)
      await verifyAlert(
        page,
        'Invalid or expired sign-up code. Please check your code and try again.'
      )
    })
  )

  test(
    'shows error for missing sign-up code',
    testWithDatabase(async ({ page }) => {
      // Navigate to gated sign-up page and submit form without code
      await navigateToGatedSignUp(page)
      await fillGatedSignUpFormPartial(page, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        // code intentionally omitted
      })
      await page.click('[data-testid="gated-signup-action"]')

      // Should stay on sign-up page with error message
      await verifyOnGatedSignUpPage(page)
      await verifyAlert(
        page,
        'Sign-up code must be at least 8 characters long.'
      )
    })
  )

  test(
    'shows error for empty/whitespace-only sign-up code',
    testWithDatabase(async ({ page }) => {
      // Navigate to gated sign-up page and submit form with whitespace-only code
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: '   ',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })

      // Should stay on sign-up page with error message
      await verifyOnGatedSignUpPage(page)
      await verifyAlert(
        page,
        'Sign-up code must be at least 8 characters long.'
      )
    })
  )

  test(
    'cannot reuse consumed sign-up code',
    testWithDatabase(async ({ page }) => {
      // First sign-up using a code
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: 'TEST-CODE-789',
        name: 'First User',
        email: 'first@example.com',
        password: 'password123',
      })

      // Should succeed and redirect to await verification
      await verifyOnAwaitVerificationPage(page)

      // Now try to use the same code again with different email
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: 'TEST-CODE-789',
        name: 'Second User',
        email: 'second@example.com',
        password: 'password123',
      })

      // Should fail with invalid code error (code was consumed)
      await verifyOnGatedSignUpPage(page)
      await verifyAlert(
        page,
        'Invalid or expired sign-up code. Please check your code and try again.'
      )
    })
  )
})
