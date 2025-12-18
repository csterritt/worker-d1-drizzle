import { test } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import {
  verifyOnSignUpPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToSignUp } from '../support/navigation-helpers'
import { submitSignUpForm } from '../support/form-helpers'
import {
  INVALID_DATA,
  VALID_NAMES,
  ERROR_MESSAGES,
  TEST_USERS,
} from '../support/test-data'

test.describe('Sign-Up Name Validation', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('OPEN_SIGN_UP')
  })

  test(
    'rejects names with special characters',
    testWithDatabase(async ({ page }) => {
      await navigateToSignUp(page)
      await verifyOnSignUpPage(page)

      // Test a representative sample of invalid names
      const invalidName = '<script>alert("xss")</script>'
      await submitSignUpForm(page, {
        name: invalidName,
        email: 'test-invalid-name@example.com',
        password: 'securepassword123',
      })

      // Should redirect to sign-in page with error message
      await verifyOnSignInPage(page)
      await verifyAlert(page, ERROR_MESSAGES.INVALID_NAME_CHARACTERS)
    })
  )

  test(
    'rejects name with @ symbol',
    testWithDatabase(async ({ page }) => {
      await navigateToSignUp(page)
      await verifyOnSignUpPage(page)

      await submitSignUpForm(page, {
        name: 'User@Name',
        email: 'test-at-name@example.com',
        password: 'securepassword123',
      })

      await verifyOnSignInPage(page)
      await verifyAlert(page, ERROR_MESSAGES.INVALID_NAME_CHARACTERS)
    })
  )

  test(
    'rejects name with punctuation marks',
    testWithDatabase(async ({ page }) => {
      await navigateToSignUp(page)
      await verifyOnSignUpPage(page)

      await submitSignUpForm(page, {
        name: 'User!Name',
        email: 'test-punct-name@example.com',
        password: 'securepassword123',
      })

      await verifyOnSignInPage(page)
      await verifyAlert(page, ERROR_MESSAGES.INVALID_NAME_CHARACTERS)
    })
  )

  test(
    'accepts valid name with letters and spaces',
    testWithDatabase(async ({ page }) => {
      await navigateToSignUp(page)
      await verifyOnSignUpPage(page)

      await submitSignUpForm(page, {
        name: 'John Doe',
        email: 'john-doe-test@example.com',
        password: 'securepassword123',
      })

      // Should NOT stay on sign-up page - should redirect to await verification
      // If we're not on sign-up page, the name was accepted
      const url = page.url()
      test.expect(url).not.toContain('/auth/sign-up')
    })
  )

  test(
    'accepts valid name with hyphens',
    testWithDatabase(async ({ page }) => {
      await navigateToSignUp(page)
      await verifyOnSignUpPage(page)

      await submitSignUpForm(page, {
        name: 'Jane-Doe',
        email: 'jane-doe-test@example.com',
        password: 'securepassword123',
      })

      const url = page.url()
      test.expect(url).not.toContain('/auth/sign-up')
    })
  )

  test(
    'accepts valid name with underscores',
    testWithDatabase(async ({ page }) => {
      await navigateToSignUp(page)
      await verifyOnSignUpPage(page)

      await submitSignUpForm(page, {
        name: 'User_Name',
        email: 'user-underscore-test@example.com',
        password: 'securepassword123',
      })

      const url = page.url()
      test.expect(url).not.toContain('/auth/sign-up')
    })
  )

  test(
    'accepts valid name with numbers',
    testWithDatabase(async ({ page }) => {
      await navigateToSignUp(page)
      await verifyOnSignUpPage(page)

      await submitSignUpForm(page, {
        name: 'User123',
        email: 'user-numbers-test@example.com',
        password: 'securepassword123',
      })

      const url = page.url()
      test.expect(url).not.toContain('/auth/sign-up')
    })
  )
})
