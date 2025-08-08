import { test, expect } from '@playwright/test'
import { startSignIn } from '../support/auth-helpers'
import { verifyOnSignInPage, verifyOnProtectedPage } from '../support/page-verifiers'
import { fillInput, clickLink, verifyAlert } from '../support/finders'

test.describe('Better-Auth Email/Password Sign In', () => {
  test('successful sign-in with valid email and password', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Fill in valid credentials
    await fillInput(page, 'email-input', 'test@example.com')
    await fillInput(page, 'password-input', 'validpassword123')

    // Submit form
    await clickLink(page, 'submit')

    // Should be redirected to protected page
    await verifyOnProtectedPage(page)
  })

  test('sign-in fails with invalid email format', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Fill in invalid email format
    await fillInput(page, 'email-input', 'not-an-email')
    await fillInput(page, 'password-input', 'validpassword123')

    // Submit form
    await clickLink(page, 'submit')

    // Should stay on sign-in page
    await verifyOnSignInPage(page)
  })

  test('sign-in fails with missing password', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Fill in only email
    await fillInput(page, 'email-input', 'test@example.com')
    // Leave password empty

    // Submit form
    await clickLink(page, 'submit')

    // Should stay on sign-in page
    await verifyOnSignInPage(page)
  })

  test('sign-in fails with password too short', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Fill in email and short password
    await fillInput(page, 'email-input', 'test@example.com')
    await fillInput(page, 'password-input', '123') // Less than 8 characters

    // Submit form
    await clickLink(page, 'submit')

    // Should stay on sign-in page
    await verifyOnSignInPage(page)
  })

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

  test('sign-in fails with wrong password', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Fill in valid email but wrong password
    await fillInput(page, 'email-input', 'test@example.com')
    await fillInput(page, 'password-input', 'wrongpassword123')

    // Submit form
    await clickLink(page, 'submit')

    // Should stay on sign-in page
    await verifyOnSignInPage(page)
  })

  test('form validation prevents submission with empty fields', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Try to submit empty form
    await clickLink(page, 'submit')

    // Should stay on sign-in page - HTML5 validation should prevent submission
    await verifyOnSignInPage(page)
  })
})
