import { test } from '@playwright/test'

import { startSignIn, signOutAndVerify } from '../support/auth-helpers'
import { fillInput, clickLink, verifyAlert } from '../support/finders'
import { verifyOnProtectedPage, verifyOnStartupPage, verifyOnSignInPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/db-helpers'

test(
  'sign out successfully after signing in',
  testWithDatabase(async ({ page }) => {
    // Navigate to startup page
    await page.goto('http://localhost:3000')

    // Start the sign-in process
    await startSignIn(page)

    // Sign in with valid credentials
    const knownEmail = 'fredfred@team439980.testinator.com'
    const knownPassword = 'freds-clever-password'

    await fillInput(page, 'email-input', knownEmail)
    await fillInput(page, 'password-input', knownPassword)
    await clickLink(page, 'submit')

    // Verify successful sign-in
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')
    await verifyOnProtectedPage(page)

    // Now sign out
    await clickLink(page, 'sign-out-link')

    // Verify we get the sign-out success message first
    await verifyAlert(page, 'You have been signed out successfully.')

    // Verify we're back on the startup page
    await verifyOnStartupPage(page)

    // Try to access the private page again - should be redirected to sign-in
    await page.goto('http://localhost:3000/private')
    
    // Should be redirected to sign-in page
    await verifyOnSignInPage(page)
    
    // Should show the access denied message
    await verifyAlert(page, 'You must sign in to visit that page')
  })
)
