// ================================================
// Test: Cross-Site Scripting Protection
//
// Description:
// This test verifies that the application's cross-site
// scripting (XSS) protection mechanism is in place and
// prevents the injection of malicious scripts in input
// fields.
//
// NOTABLY: These tests are skipped because they rely
// on the browser's built-in security features to
// be turned off. In a real-world scenario, the
// browser would block the injection of scripts, since
// the types of input fields are restricted.
//
// To run these tests, you need to disable the built-in
// types of input fields and allow for the injection
// of scripts:
//
// Remove the type="email" attribute from the email input field in
//    the sign-in page
// Remove these fields from the accept-code page:
//    type='text'
//    inputMode='numeric'
//    pattern='[0-9]{6}'
//    maxLength={6}
//    minLength={6}
// ================================================

import { test, expect, Page } from '@playwright/test'

import {
  verifyOnSignInPage,
  verifyOnAwaitCodePage,
} from '../support/page-verifiers'
import { startSignIn, submitEmail, cancelSignIn } from '../support/auth-helpers'
import { clickLink, fillInput, verifyAlert } from '../support/finders'

// Create a test fixture with isolated test context
type TestFixture = {
  page: Page
}

// XSS test payloads
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  '"><script>alert("XSS")</script>',
  'javascript:alert("XSS")',
  '<svg/onload=alert("XSS")>',
  '<iframe src="javascript:alert(`XSS`)"></iframe>',
]

// Function to check if an alert dialog appears (it shouldn't)
async function checkNoAlertDialog(page: Page): Promise<void> {
  // This will fail the test if an alert dialog appears
  page.on('dialog', (dialog) => {
    throw new Error(`Alert dialog appeared with message: ${dialog.message()}`)
  })

  // Wait a moment to ensure no dialogs appear
  await page.waitForTimeout(1000)
}

test.describe.skip('XSS Protection Tests', () => {
  test('email input field should sanitize XSS payloads', async ({ page }) => {
    // Navigate to sign-in page
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    for (const payload of xssPayloads) {
      // Fill the email input with XSS payload
      await fillInput(page, 'email', payload)

      // Check that no alert dialog appears
      await checkNoAlertDialog(page)

      // Submit the form
      await page.getByTestId('submit').click()

      // Verify we're still on sign-in page with validation error
      await verifyOnSignInPage(page)

      // Verify error message is displayed safely
      const alertElement = page.getByRole('alert')
      await expect(alertElement).toBeVisible()

      // Get the error message text and verify it doesn't contain unescaped HTML
      const alertText = await alertElement.textContent()
      expect(alertText).not.toContain('<script>')
      expect(alertText).not.toContain('onerror=')

      // Clear the input for next iteration
      await page.getByTestId('email-input').clear()
    }
  })

  test('OTP code input field should sanitize XSS payloads', async ({
    page,
  }) => {
    // Navigate to sign-in page and submit a valid email to get to code entry page
    await page.goto('http://localhost:3000')
    await startSignIn(page)
    await submitEmail(page, 'fredfred@team439980.testinator.com')

    // Verify we're on the await code page
    await verifyOnAwaitCodePage(page)

    for (const payload of xssPayloads) {
      // Fill the OTP input with XSS payload
      await fillInput(page, 'code', payload)

      // Check that no alert dialog appears
      await checkNoAlertDialog(page)

      // Submit the form with bad code
      await fillInput(page, 'code', payload)
      await clickLink(page, 'submit')

      // Verify we're back on await code page with NOTABLY THE WRONG error, but an error nonetheless
      await verifyOnAwaitCodePage(page)
      await verifyAlert(page, 'Please enter a valid email address')

      // Verify error message is displayed safely
      const alertElement = page.getByRole('alert')
      await expect(alertElement).toBeVisible()

      // Get the error message text and verify it doesn't contain unescaped HTML
      const alertText = await alertElement.textContent()
      expect(alertText).not.toContain('<script>')
      expect(alertText).not.toContain('onerror=')

      // Clear the input for next iteration
      await page.getByTestId('otp-input').clear()
    }

    // Clean up - cancel sign in
    await cancelSignIn(page)
  })

  test('error messages should properly escape XSS payloads', async ({
    page,
  }) => {
    // This test specifically checks if error messages properly escape HTML
    // We'll use URL parameters to simulate error messages with XSS payloads

    for (const payload of xssPayloads) {
      // Encode the XSS payload for URL
      const encodedPayload = encodeURIComponent(payload)

      // Visit sign-in page with error message containing XSS payload
      await page.goto(
        `http://localhost:3000/auth/sign-in?error=${encodedPayload}`
      )

      // Check that no alert dialog appears
      await checkNoAlertDialog(page)

      // Verify the DOM structure doesn't contain script elements
      const scriptElements = await page.$$('script:not([src])')
      for (const script of scriptElements) {
        const content = await script.textContent()
        expect(content).not.toContain('alert("XSS")')
      }
    }
  })
})
