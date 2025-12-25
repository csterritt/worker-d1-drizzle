import { test, expect } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { checkCodeExists } from '../support/db-helpers'
import { navigateToGatedSignUp } from '../support/navigation-helpers'
import { submitGatedSignUpForm } from '../support/form-helpers'
import {
  verifyOnGatedSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'
import { verifyAlert } from '../support/finders'

test.describe('Gated Sign-Up: Code Consumption Semantics', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('GATED_SIGN_UP')
  })

  test(
    'code is consumed only after successful sign-up',
    testWithDatabase(async ({ page }) => {
      const testCode = 'DEMO-ACCESS-111'

      // Verify code exists before sign-up
      const existsBefore = await checkCodeExists(testCode)
      expect(existsBefore).toBe(true)

      // Complete successful sign-up
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: testCode,
        name: 'Test User',
        email: 'consumption-test@example.com',
        password: 'password123',
      })

      // Should succeed and redirect to await verification
      await verifyOnAwaitVerificationPage(page)

      // Verify code is now consumed (deleted)
      const existsAfter = await checkCodeExists(testCode)
      expect(existsAfter).toBe(false)
    })
  )

  test(
    'code is NOT consumed when sign-up fails due to invalid email format',
    testWithDatabase(async ({ page }) => {
      const testCode = 'EARLY-BIRD-456'

      // Verify code exists before sign-up attempt
      const existsBefore = await checkCodeExists(testCode)
      expect(existsBefore).toBe(true)

      // Attempt sign-up with invalid email (validation should fail)
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: testCode,
        name: 'Test User',
        email: 'invalid-email', // Invalid email format
        password: 'password123',
      })

      // Should stay on sign-up page with error
      await verifyOnGatedSignUpPage(page)
      await verifyAlert(page, 'Please enter a valid email address.')

      // Code should still exist (not consumed because sign-up failed at validation)
      const existsAfter = await checkCodeExists(testCode)
      expect(existsAfter).toBe(true)
    })
  )

  test(
    'code is NOT consumed when sign-up fails due to duplicate email',
    testWithDatabase(async ({ page }) => {
      const testCode = 'BETA-ACCESS-123'

      // Verify code exists before sign-up attempt
      const existsBefore = await checkCodeExists(testCode)
      expect(existsBefore).toBe(true)

      // Attempt sign-up with existing email (fredfred@team439980.testinator.com is seeded)
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: testCode,
        name: 'Duplicate User',
        email: 'fredfred@team439980.testinator.com', // Already exists in seeded data
        password: 'password123',
      })

      // Should redirect to await verification (security: don't reveal email exists)
      // or show account exists message
      await verifyOnAwaitVerificationPage(page)

      // Code should still exist because account creation failed (duplicate email)
      const existsAfter = await checkCodeExists(testCode)
      expect(existsAfter).toBe(true)
    })
  )

  test(
    'user can retry with same code after validation failure',
    testWithDatabase(async ({ page }) => {
      const testCode = 'WELCOME2024'

      // First attempt: fail with short password
      await navigateToGatedSignUp(page)
      await submitGatedSignUpForm(page, {
        code: testCode,
        name: 'Test User',
        email: 'retry-test@example.com',
        password: 'short', // Too short
      })

      // Should stay on sign-up page with error
      await verifyOnGatedSignUpPage(page)

      // Code should still exist
      const existsAfterFirstAttempt = await checkCodeExists(testCode)
      expect(existsAfterFirstAttempt).toBe(true)

      // Second attempt: succeed with valid password
      await submitGatedSignUpForm(page, {
        code: testCode,
        name: 'Test User',
        email: 'retry-test@example.com',
        password: 'password123',
      })

      // Should succeed
      await verifyOnAwaitVerificationPage(page)

      // Now code should be consumed
      const existsAfterSecondAttempt = await checkCodeExists(testCode)
      expect(existsAfterSecondAttempt).toBe(false)
    })
  )
})
