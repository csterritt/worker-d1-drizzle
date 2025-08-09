import { test, expect } from '@playwright/test'
import { startSignIn } from '../support/auth-helpers'
import {
  verifyOnSignInPage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { testWithDatabase } from '../support/db-helpers'

test.describe('Better-Auth Email/Password Sign In', () => {
  test(
    'redirect to sign-in for unauthenticated users',
    testWithDatabase(async ({ page }) => {
      // Try to access protected page without signing in
      await page.goto('http://localhost:3000/private')

      // Should be redirected to sign-in page
      await verifyOnSignInPage(page)
    })
  )

  test(
    'successful sign-in with valid email and password',
    testWithDatabase(async ({ page }) => {
      // Navigate to sign-in page
      await page.goto('http://localhost:3000')
      await startSignIn(page)

      // Fill in valid credentials
      await fillInput(page, 'email-input', 'csterritt@gmail.com')
      await fillInput(page, 'password-input', 'asdfasdfasdf')

      // Submit form
      await clickLink(page, 'submit')

      // Should be redirected to protected page
      await verifyOnProtectedPage(page)
    })
  )

  test(
    'sign-in fails with invalid email',
    testWithDatabase(async ({ page }) => {
      await page.goto('http://localhost:3000')
      await startSignIn(page)

      // Fill in invalid email
      await fillInput(page, 'email-input', 'nonexistent@example.com')
      await fillInput(page, 'password-input', 'anypassword123')

      // Submit form
      await clickLink(page, 'submit')

      // Should stay on sign-in page
      await verifyOnSignInPage(page)
    })
  )

  test(
    'sign-in fails with missing password',
    testWithDatabase(async ({ page }) => {
      await page.goto('http://localhost:3000')
      await startSignIn(page)

      // Fill in only email
      await fillInput(page, 'email-input', 'csterritt@gmail.com')
      // Leave password empty

      // Submit form
      await clickLink(page, 'submit')

      // Should stay on sign-in page
      await verifyOnSignInPage(page)
    })
  )

  test(
    'sign-in fails with password too short',
    testWithDatabase(async ({ page }) => {
      await page.goto('http://localhost:3000')
      await startSignIn(page)

      // Fill in email and short password
      await fillInput(page, 'email-input', 'csterritt@gmail.com')
      await fillInput(page, 'password-input', '123') // Less than 8 characters

      // Submit form
      await clickLink(page, 'submit')

      // Should stay on sign-in page
      await verifyOnSignInPage(page)
    })
  )

  test('sign-in fails with non-existent user', async ({ page, request }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Fill in credentials for non-existent user
    await fillInput(page, 'email-input', 'nonexistent@example.com')
    await fillInput(page, 'password-input', 'validpassword123')

    // Submit form
    await clickLink(page, 'submit')

    // Should stay on sign-in page with error
    await verifyOnSignInPage(page)
  })

  test(
    'sign-in fails with wrong password',
    testWithDatabase(async ({ page }) => {
      await page.goto('http://localhost:3000')
      await startSignIn(page)

      // Fill in valid email but wrong password
      await fillInput(page, 'email-input', 'csterritt@gmail.com')
      await fillInput(page, 'password-input', 'wrongpassword123')

      // Submit form
      await clickLink(page, 'submit')

      // Should stay on sign-in page
      await verifyOnSignInPage(page)
    })
  )

  test(
    'form validation prevents submission with empty fields',
    testWithDatabase(async ({ page }) => {
      await page.goto('http://localhost:3000')
      await startSignIn(page)

      // Try to submit empty form
      await clickLink(page, 'submit')

      // Should stay on sign-in page - HTML5 validation should prevent submission
      await verifyOnSignInPage(page)
    })
  )
})
