import { test, expect } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnAwaitVerificationPage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'

// Helper function to get the latest email from Mailpit
async function getLatestEmailFromMailpit() {
  const response = await fetch('http://localhost:8025/api/v1/message/latest')
  if (!response.ok) {
    throw new Error(`Failed to fetch latest email: ${response.status}`)
  }
  return await response.json()
}

// Helper function to clear all emails from Mailpit
async function clearAllEmailsFromMailpit() {
  try {
    const response = await fetch('http://localhost:8025/api/v1/messages', {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      console.warn(`Failed to clear emails: ${response.status}`)
    }
  } catch (error) {
    console.warn('Could not clear emails from Mailpit:', error)
  }
}

// Helper function to extract verification link from email HTML
function extractVerificationLink(htmlContent: string): string {
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
    // Clear all emails from Mailpit before the test
    await clearAllEmailsFromMailpit()

    // Navigate to sign-in page (which contains the sign-up form)
    await page.goto('http://localhost:3000/auth/sign-in')

    // Verify we're on the sign-in page
    await verifyOnSignInPage(page)

    // Sign up with new credentials
    const newName = 'Resend Email User'
    const newEmail = 'resendemail@example.com'
    const newPassword = 'resendpassword123'

    await fillInput(page, 'signup-name-input', newName)
    await fillInput(page, 'signup-email-input', newEmail)
    await fillInput(page, 'signup-password-input', newPassword)
    await clickLink(page, 'signup-submit')

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Verify the URL contains the email parameter
    const currentUrl = page.url()
    expect(currentUrl).toContain('/auth/await-verification')
    expect(currentUrl).toContain(`email=${encodeURIComponent(newEmail)}`)

    // Verify that the resend email button is visible
    const resendButton = page.getByTestId('resend-email-button')
    await expect(resendButton).toBeVisible()

    // Verify on await verification page
    await verifyOnAwaitVerificationPage(page)

    // Click resend email button
    await resendButton.click()

    // Should stay on await verification page
    await verifyOnAwaitVerificationPage(page)

    // Should show success message about email being sent
    await verifyAlert(
      page,
      'A new verification email has been sent. Please check your inbox.'
    )

    // Verify we're still on the correct page with email parameter
    const newUrl = page.url()
    expect(newUrl).toContain('/auth/await-verification')
    expect(newUrl).toContain(`email=${encodeURIComponent(newEmail)}`)

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
    await page.goto('http://localhost:3000/auth/sign-in')
    await verifyOnSignInPage(page)

    await fillInput(page, 'email-input', newEmail)
    await fillInput(page, 'password-input', newPassword)
    await clickLink(page, 'submit')

    // Should be successfully signed in and redirected to protected page
    await verifyOnProtectedPage(page)
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')
  })
)
