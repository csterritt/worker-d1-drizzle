import { Page, expect } from '@playwright/test'
import { clickLink, fillInput, getElementText, verifyAlert } from './finders'
import {
  verifyOnStartupPage,
  verifyOnSignInPage,
  verifyOnAwaitCodePage,
  verifyOnProtectedPage,
} from './page-verifiers'

export async function signOutAndVerify(page: Page) {
  await clickLink(page, 'sign-out-link')
  await verifyOnStartupPage(page)
}

export async function startSignIn(page: Page) {
  // Click the Sign In link on the home page
  await clickLink(page, 'sign-in-link')
  // Verify we're on the sign-in page
  await verifyOnSignInPage(page)
}

export async function submitCode(page: Page, code: string) {
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')
}

export async function submitEmailAndPassword(page: Page, email: string, password: string) {
  await fillInput(page, 'email-input', email)
  await fillInput(page, 'password-input', password)
  await clickLink(page, 'submit')
  // For successful login, we should be redirected to the protected page
  await verifyOnProtectedPage(page)
}

// Legacy function for backward compatibility - now just submits email field
export async function submitEmail(page: Page, email: string) {
  await fillInput(page, 'email-input', email)
  // Note: This function is deprecated in favor of submitEmailAndPassword
  // In the new flow, password is also required
}

export async function submitInvalidEmail(page: Page, email: string) {
  await fillInput(page, 'email-input', email)
  await clickLink(page, 'submit')
  await verifyOnSignInPage(page)
  await verifyAlert(page, `Please enter a valid email address`)

  // Verify email input still has value
  await expect(page.getByTestId('email-input')).toHaveValue(email)
}

export async function signUpUser(page: Page, name: string, email: string, password: string) {
  // Navigate to sign-in page first
  await startSignIn(page)
  
  // Show the signup form
  await clickLink(page, 'show-signup')
  
  // Fill in signup form using correct data-testid selectors
  await fillInput(page, 'signup-name-input', name)
  await fillInput(page, 'signup-email-input', email)
  await fillInput(page, 'signup-password-input', password)
  
  // Submit signup form
  await clickLink(page, 'signup-submit')
  
  // Should be redirected to protected page after successful signup
  await verifyOnProtectedPage(page)
}

export async function signInUser(page: Page, email: string, password: string) {
  // Navigate to sign-in page if not already there
  await startSignIn(page)
  
  // Fill and submit login form
  await submitEmailAndPassword(page, email, password)
}

// Legacy function - no longer needed in better-auth flow
export async function cancelSignIn(page: Page) {
  // Note: Cancel functionality may not be needed in better-auth flow
  // as there's no intermediate "await code" state
  await verifyOnStartupPage(page)
}

export async function submitInvalidCode(page: Page, code: string = ' ') {
  // Submit invalid code
  if (code) {
    await fillInput(page, 'code', code)
  }
  await clickLink(page, 'submit')

  // Verify error message for empty code
  await verifyAlert(
    page,
    `You must supply the code sent to your email address. Check your spam filter, and after a few minutes, if it hasn't arrived, click the 'Resend' button below to try again.`
  )

  // Re-verify we're still on the code entry page
  await verifyOnAwaitCodePage(page)
}

export async function submitValidCode(page: Page, code: string) {
  // Submit code and verify successful sign-in
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')
  await verifyAlert(page, 'You have signed in successfully!')

  // Verify we're on the protected page after successful sign-in
  await verifyOnProtectedPage(page)
}

export async function submitTimedOutCode(page: Page, code: string) {
  // Submit timed out code
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')

  // Verify back on sign-in page with error
  await verifyOnSignInPage(page)
  await verifyAlert(page, 'That code has expired, please sign in again')
}

export async function submitBadCode(page: Page, code: string) {
  // Submit bad code
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')

  // Verify we're back on await code page with error
  await verifyOnAwaitCodePage(page)
  await verifyAlert(page, 'Invalid OTP or verification failed')
}

export async function submitExpiredCode(page: Page, code: string) {
  // Submit expired code
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')

  // Verify we're back on home page with error
  await verifyOnSignInPage(page)
  await verifyAlert(page, 'Sign in code has expired, please sign in again')
}

export async function resendCodeAndVerify(page: Page) {
  // Click the resend button
  await clickLink(page, 'resend-code-button')

  // Verify we're still on the await code page
  await verifyOnAwaitCodePage(page)

  // Verify notification message
  await verifyAlert(
    page,
    'Code sent! Please check your email (including spam folder).'
  )
}

export async function searchPodcasts(page: Page, searchQuery: string) {
  // Fill the search input and submit the form
  await fillInput(page, 'Enter search term (min 4 characters)', searchQuery)
  await page.getByRole('button', { name: 'Search' }).click()
}

export async function verifySearchResultsCount(
  page: Page,
  expectedCount: number
) {
  // Get all search result cards
  const resultCards = page.locator('.card')
  await expect(resultCards).toHaveCount(expectedCount)
}
