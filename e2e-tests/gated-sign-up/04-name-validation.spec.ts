import { test } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import { verifyOnGatedSignUpPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToGatedSignUp } from '../support/navigation-helpers'
import { submitGatedSignUpForm } from '../support/form-helpers'
import { GATED_CODES, ERROR_MESSAGES } from '../support/test-data'

test.describe('Gated Sign-Up Name Validation', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('GATED_SIGN_UP')
  })

  test(
    'rejects names with special characters',
    testWithDatabase(async ({ page }) => {
      await navigateToGatedSignUp(page)
      await verifyOnGatedSignUpPage(page)

      await submitGatedSignUpForm(page, {
        code: GATED_CODES.WELCOME,
        name: '<script>alert("xss")</script>',
        email: 'test-invalid-name@example.com',
        password: 'securepassword123',
      })

      await verifyOnGatedSignUpPage(page)
      await verifyAlert(page, ERROR_MESSAGES.INVALID_NAME_CHARACTERS)
    })
  )

  test(
    'rejects name with @ symbol',
    testWithDatabase(async ({ page }) => {
      await navigateToGatedSignUp(page)
      await verifyOnGatedSignUpPage(page)

      await submitGatedSignUpForm(page, {
        code: GATED_CODES.BETA,
        name: 'User@Name',
        email: 'test-at-name@example.com',
        password: 'securepassword123',
      })

      await verifyOnGatedSignUpPage(page)
      await verifyAlert(page, ERROR_MESSAGES.INVALID_NAME_CHARACTERS)
    })
  )

  test(
    'rejects name with punctuation marks',
    testWithDatabase(async ({ page }) => {
      await navigateToGatedSignUp(page)
      await verifyOnGatedSignUpPage(page)

      await submitGatedSignUpForm(page, {
        code: GATED_CODES.EARLY_BIRD,
        name: 'User!Name',
        email: 'test-punct-name@example.com',
        password: 'securepassword123',
      })

      await verifyOnGatedSignUpPage(page)
      await verifyAlert(page, ERROR_MESSAGES.INVALID_NAME_CHARACTERS)
    })
  )

  test(
    'accepts valid name with letters and spaces',
    testWithDatabase(async ({ page }) => {
      await navigateToGatedSignUp(page)
      await verifyOnGatedSignUpPage(page)

      await submitGatedSignUpForm(page, {
        code: 'TEST-CODE-789',
        name: 'John Doe',
        email: 'john-doe-gated@example.com',
        password: 'securepassword123',
      })

      const url = page.url()
      test.expect(url).not.toContain('/auth/sign-up')
    })
  )

  test(
    'accepts valid name with hyphens and underscores',
    testWithDatabase(async ({ page }) => {
      await navigateToGatedSignUp(page)
      await verifyOnGatedSignUpPage(page)

      await submitGatedSignUpForm(page, {
        code: 'DEMO-ACCESS-111',
        name: 'Test-User_123',
        email: 'test-user-gated@example.com',
        password: 'securepassword123',
      })

      const url = page.url()
      test.expect(url).not.toContain('/auth/sign-up')
    })
  )
})
