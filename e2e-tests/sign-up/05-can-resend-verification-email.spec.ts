import { test, expect } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnSignUpPage,
  verifyOnAwaitVerificationPage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  navigateToSignUp,
  navigateToSignIn,
} from '../support/navigation-helpers'
import { submitSignUpForm, submitSignInForm } from '../support/form-helpers'

// Helper function to get the latest email from Mailpit
const getLatestEmailFromMailpit = async () => {
  const response = await fetch('http://localhost:8025/api/v1/message/latest')
  if (!response.ok) {
    throw new Error(`Failed to fetch latest email: ${response.status}`)
  }
  return await response.json()
}

// Helper function to clear all emails from Mailpit
const clearAllEmailsFromMailpit = async () => {
  try {
    const response = await fetch('http://localhost:8025/api/v1/messages', {
      method: 'DELETE',
    })

    if (!response.ok) {
      console.warn(`Failed to clear emails: ${response.status}`)
    }
  } catch (error) {
    console.warn('Could not clear emails from Mailpit:', error)
  }
}

// Helper function to extract verification link from email HTML
const extractVerificationLink = (htmlContent: string): string => {
  // Look for links that contain 'verify-email' or 'token='
  const linkRegex =
    /<a[^>]+href=["']([^"']*(?:verify-email|token=)[^"']*)["'][^>]*>/gi
  const matches = linkRegex.exec(htmlContent)

  if (!matches || !matches[1]) {
    throw new Error('Verification link not found in email content')
  }

  return matches[1]
}

test(
  'can resend verification email from await verification page',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Clear all emails from Mailpit before the test
    await clearAllEmailsFromMailpit()

    // Navigate to sign-up page and submit form
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // Sign up with new credentials
    const newName = 'Resend Email User'
    const newEmail = 'resendemail@example.com'
    const newPassword = 'resendpassword123'

    await submitSignUpForm(page, {
      name: newName,
      email: newEmail,
      password: newPassword,
    })

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Verify the URL is the await verification page (no email parameter needed since we use cookies now)
    const currentUrl = page.url()
    expect(currentUrl).toContain('/auth/await-verification')

    // Verify that the resend email button is visible
    const resendButton = page.getByTestId('resend-email-button')
    await expect(resendButton).toBeVisible()

    // Verify on await verification page
    await verifyOnAwaitVerificationPage(page)

    // Verify the resend button is available
    await expect(resendButton).toBeVisible()

    // Should stay on await verification page
    await verifyOnAwaitVerificationPage(page)

    // Wait for the rate limit period to expire (3 seconds in test environment)
    // This is necessary because we now track the initial email send time
    console.log('Waiting for rate limit to expire...')
    await page.waitForTimeout(4000) // Wait 4 seconds to be safe

    // Click the resend email button (should now work since rate limit expired)
    await resendButton.click()

    // Should get success message
    await verifyAlert(
      page,
      'A new verification email has been sent. Please check your inbox.'
    )

    // Verify we're still on the correct page (no email parameter needed since we use cookies now)
    const newUrl = page.url()
    expect(newUrl).toContain('/auth/await-verification')

    // Verify the resend button is still available for future use
    await expect(resendButton).toBeVisible()

    // Wait a moment for the resent email to be sent
    await page.waitForTimeout(2000)

    // Retrieve the resent verification email from Mailpit
    const emailData: any = await getLatestEmailFromMailpit()
    expect(
      emailData.To.some((recipient: any) => recipient.Address === newEmail)
    ).toBe(true)
    expect(emailData.Subject).toContain('Confirm Your Email Address')

    // Get the HTML content directly from the email data
    const htmlContent = emailData.HTML

    // Extract the verification link from the resent email
    const verificationLink = extractVerificationLink(htmlContent)

    // Follow the verification link
    await page.goto(verificationLink)

    // Should be redirected to a confirmation page or sign-in page
    // Wait for the page to load and check for success indicators
    await page.waitForTimeout(1000)

    // Now try to sign in with the verified credentials
    await navigateToSignIn(page)
    await verifyOnSignInPage(page)

    await submitSignInForm(page, { email: newEmail, password: newPassword })

    // Should be successfully signed in and redirected to protected page
    await verifyOnProtectedPage(page)
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')
  })
)
