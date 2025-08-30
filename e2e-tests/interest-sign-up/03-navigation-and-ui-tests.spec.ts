import { test, expect } from '@playwright/test'

import { fillInput, clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnInterestSignUpPage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'
import { signInUser } from '../support/auth-helpers'
import { testWithDatabase } from '../support/test-helpers'
import {
  navigateToSignIn,
  navigateToInterestSignUp,
  navigateToHome,
} from '../support/navigation-helpers'

test.describe('Interest Sign-Up Mode: Navigation and UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('INTEREST_SIGN_UP')
  })

  test('sign-in page shows correct button text and navigation', async ({
    page,
  }) => {
    // Navigate to sign-in page
    await navigateToSignIn(page)

    // Verify "Join Waitlist" button exists and has correct text
    const waitlistButton = page.locator('[data-testid="go-to-sign-up-button"]')
    await expect(waitlistButton).toBeVisible()
    await expect(waitlistButton).toHaveText('Join Waitlist')

    // Verify the button links to the correct URL
    const href = await waitlistButton.getAttribute('href')
    expect(href).toBe('/auth/interest-sign-up')
  })

  test('interest sign-up page has correct UI elements', async ({ page }) => {
    // Navigate to interest sign-up page
    await navigateToInterestSignUp(page)

    // Verify page title
    const title = page.locator('h2.card-title')
    await expect(title).toHaveText('Join the Waitlist')

    // Verify explanatory text exists
    const explanation = page.locator('.text-base-content\\/80')
    await expect(explanation).toContainText(
      "We're not accepting new accounts at the moment"
    )
    await expect(explanation).toContainText(
      'Enter your email address to join our waitlist'
    )

    // Verify form elements exist
    await expect(
      page.locator('[data-testid="interest-email-input"]')
    ).toBeVisible()
    await expect(page.locator('[data-testid="interest-submit"]')).toBeVisible()
    await expect(
      page.locator('[data-testid="go-to-sign-in-button"]')
    ).toBeVisible()

    // Verify button texts
    await expect(page.locator('[data-testid="interest-submit"]')).toHaveText(
      'Join Waitlist'
    )
    await expect(
      page.locator('[data-testid="go-to-sign-in-button"]')
    ).toHaveText('Sign In Instead')
  })

  test('can navigate back and forth between sign-in and interest sign-up', async ({
    page,
  }) => {
    // Start at sign-in page
    await navigateToSignIn(page)

    // Click "Join Waitlist" to go to interest sign-up
    await clickLink(page, 'go-to-sign-up-button')
    await verifyOnInterestSignUpPage(page)

    // Click "Sign In Instead" to go back
    await clickLink(page, 'go-to-sign-in-button')
    await verifyOnSignInPage(page)
  })

  test(
    'redirects to sign-in when already authenticated',
    testWithDatabase(async ({ page }) => {
      // Navigate to startup page first
      await navigateToHome(page)

      // Sign in as an existing seeded user
      const knownEmail = 'fredfred@team439980.testinator.com'
      const knownPassword = 'freds-clever-password'

      await signInUser(page, knownEmail, knownPassword)

      // Verify we're signed in and on the protected page
      await verifyOnProtectedPage(page)

      // Now try to navigate to interest sign-up page while authenticated
      // Do not use navigateToInterestSignUp here because we expect a redirect
      await page.goto('http://localhost:3000/auth/interest-sign-up')

      // Should be redirected back to protected page with a message about already being signed in
      await verifyOnProtectedPage(page)

      // Verify the URL is correct (should be redirected away from interest-sign-up)
      expect(page.url()).toContain('/private')
    })
  )

  test('handles direct navigation to interest sign-up URL', async ({
    page,
  }) => {
    // Navigate directly to the interest sign-up URL
    await navigateToInterestSignUp(page)

    // Should load the page correctly
    await verifyOnInterestSignUpPage(page)

    // Verify all elements are present
    await expect(
      page.locator('[data-testid="interest-email-input"]')
    ).toBeVisible()
    await expect(page.locator('[data-testid="interest-submit"]')).toBeVisible()
  })

  test('preserves email in form when validation fails', async ({ page }) => {
    // Navigate to interest sign-up page
    await navigateToInterestSignUp(page)

    // Enter invalid email
    const invalidEmail = 'invalid-email'
    await fillInput(page, 'interest-email-input', invalidEmail)
    await clickLink(page, 'interest-submit')

    // Should stay on page with error and preserve email
    await verifyOnInterestSignUpPage(page)
    await verifyAlert(page, 'Please enter a valid email address.')

    // Check that email is preserved in the input
    const emailInput = page.locator('[data-testid="interest-email-input"]')
    await expect(emailInput).toHaveValue(invalidEmail)
  })
})
