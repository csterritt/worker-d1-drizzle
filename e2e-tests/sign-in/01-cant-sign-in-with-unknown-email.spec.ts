import { test } from '@playwright/test'

import { startSignIn } from '../support/auth-helpers'
import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'

test('cannot sign in with unknown email', async ({ page }) => {
  // Navigate to startup page
  await page.goto('http://localhost:3000')

  // Start the sign-in process
  await startSignIn(page)

  // Try to sign in with an email that doesn't exist in the database
  const unknownEmail = 'nonexistent@example.com'
  const testPassword = 'testpassword123'

  await fillInput(page, 'email-input', unknownEmail)
  await fillInput(page, 'password-input', testPassword)
  await clickLink(page, 'submit')

  // Should remain on sign-in page (not redirect to protected page)
  await verifyOnSignInPage(page)

  // Should show an error message indicating the email is not found
  // The exact error message may vary based on your auth implementation
  // Common messages might be "Invalid credentials" or "User not found"
  await verifyAlert(
    page,
    'Invalid email or password. Please check your credentials and try again.'
  )
})
