import { test, expect } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnSignUpPage,
  verifyOnProtectedPage,
  verifyOnAwaitVerificationPage,
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
  'can validate email and sign in successfully',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up and submit form
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // Sign up with new credentials
    const newName = 'Email Validator'
    const newEmail = 'validator@example.com'
    const newPassword = 'validatorpassword123'

    await submitSignUpForm(page, {
      name: newName,
      email: newEmail,
      password: newPassword,
    })

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Wait a moment for the email to be sent
    await page.waitForTimeout(2000)

    // Retrieve the verification email from Mailpit
    const emailData: any = await getLatestEmailFromMailpit()
    expect(
      emailData.To.some((recipient: any) => recipient.Address === newEmail)
    ).toBe(true)
    expect(emailData.Subject).toContain('Confirm Your Email Address')

    // Get the HTML content directly from the email data
    const htmlContent = emailData.HTML

    // Extract the verification link
    const verificationLink = extractVerificationLink(htmlContent)

    // Follow the verification link
    await page.goto(verificationLink)

    // Should be redirected to a confirmation page or sign-in page
    // Wait for the page to load and check for success indicators
    await page.waitForTimeout(1000)

    await verifyOnSignInPage(page)
    await verifyAlert(
      page,
      'Your email has been verified successfully. You may now sign in.'
    )

    // Now try to sign in with the verified credentials
    await navigateToSignIn(page)
    await verifyOnSignInPage(page)

    await submitSignInForm(page, { email: newEmail, password: newPassword })

    // Should be successfully signed in and redirected to protected page
    await verifyOnProtectedPage(page)
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')
  })
)
