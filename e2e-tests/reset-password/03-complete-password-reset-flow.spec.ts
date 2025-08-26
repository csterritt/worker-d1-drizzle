import { test, expect } from '@playwright/test'

import { fillInput, clickLink, verifyAlert, isElementVisible } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnProtectedPage,
  verifyOnForgotPasswordPage,
  verifyOnWaitingForResetPage,
  verifyOnResetPasswordPage,
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
      method: 'DELETE',
    })

    if (!response.ok) {
      console.warn(`Failed to clear emails: ${response.status}`)
    }
  } catch (error) {
    console.warn('Could not clear emails from Mailpit:', error)
  }
}

// Helper function to extract password reset link from email HTML
function extractPasswordResetLink(htmlContent: string): string {
  // Look for links that contain 'reset-password' or 'token='
  const linkRegex =
    /<a[^>]+href=["']([^"']*(?:reset-password|token=)[^"']*)["'][^>]*>/gi
  const matches = linkRegex.exec(htmlContent)

  if (!matches || !matches[1]) {
    throw new Error('Password reset link not found in email content')
  }

  return matches[1]
}

test(
  'complete password reset flow with email verification',
  testWithDatabase(async ({ page }) => {
    // Clear all emails from Mailpit before the test
    await clearAllEmailsFromMailpit()

    // Navigate to forgot password page
    await page.goto('http://localhost:3000/auth/forgot-password')
    await verifyOnForgotPasswordPage(page)

    // Use a known email from the test database
    const email = 'fredfred@team439980.testinator.com'
    const oldPassword = 'freds-clever-password'
    const newPassword = 'freds-new-password-123'

    // Request password reset
    await fillInput(page, 'forgot-email-input', email)
    await clickLink(page, 'forgot-password-submit')

    // Should be redirected to waiting for reset page
    await verifyOnWaitingForResetPage(page)

    // Wait a moment for the email to be sent
    await page.waitForTimeout(2000)

    // Retrieve the password reset email from Mailpit
    const emailData: any = await getLatestEmailFromMailpit()
    expect(
      emailData.To.some((recipient: any) => recipient.Address === email)
    ).toBe(true)
    expect(emailData.Subject).toContain('Reset Your Password')

    // Get the HTML content directly from the email data
    const htmlContent = emailData.HTML

    // Extract the password reset link
    const resetLink = extractPasswordResetLink(htmlContent)

    // Follow the password reset link
    await page.goto(resetLink)

    // Should be on the reset password page
    await verifyOnResetPasswordPage(page)

    // Verify all form elements are present
    expect(await isElementVisible(page, 'new-password-input')).toBe(true)
    expect(await isElementVisible(page, 'confirm-password-input')).toBe(true)
    expect(await isElementVisible(page, 'reset-password-submit')).toBe(true)

    // Fill in the new password
    await fillInput(page, 'new-password-input', newPassword)
    await fillInput(page, 'confirm-password-input', newPassword)
    await clickLink(page, 'reset-password-submit')

    // Should be redirected to sign-in page with success message
    await verifyOnSignInPage(page)
    await verifyAlert(
      page,
      'Your password has been successfully reset. You can now sign in with your new password.'
    )

    // Now try to sign in with the new password
    await fillInput(page, 'email-input', email)
    await fillInput(page, 'password-input', newPassword)
    await clickLink(page, 'submit')

    // Should be successfully signed in and redirected to protected page
    await verifyOnProtectedPage(page)
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')

    // Verify that the old password no longer works by signing out and trying
    // Click the sign-out button (which submits a POST form)
    await clickLink(page, 'sign-out-link')
    await page.waitForTimeout(1000)

    // Should be redirected to home page after sign-out
    await expect(page).toHaveURL('http://localhost:3000/')

    // Try to sign in with old password
    await page.goto('http://localhost:3000/auth/sign-in')
    await verifyOnSignInPage(page)

    await fillInput(page, 'email-input', email)
    await fillInput(page, 'password-input', oldPassword)
    await clickLink(page, 'submit')

    // Should stay on sign-in page with error message
    await verifyOnSignInPage(page)
    await verifyAlert(
      page,
      'Invalid email or password. Please check your credentials and try again.'
    )
  })
)
