import { test, expect, Page } from '@playwright/test'

import {
  verifyOnStartupPage,
  verifyOnProtectedPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  submitValidCode,
  signOutAndVerify,
} from '../support/auth-helpers'
import { clickLink } from '../support/finders'

// Create a test fixture with isolated test context
type TestFixture = {
  page: Page
  testEmail: string
}

// Extend the base test with our custom fixture
const customTest = test.extend<TestFixture>({
  testEmail: async ({}, use) => {
    // Create a unique email for this test
    await use(`fredfred@team439980.testinator.com`)
  },
})

customTest(
  'authenticated session persists across page reloads',
  async ({ page, testEmail }) => {
    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)

    // Sign in
    await startSignIn(page)

    // Submit email and verify success
    await submitEmail(page, testEmail)

    // Submit the valid code and verify successful sign-in
    await submitValidCode(page, '123456')

    // Verify we're on the protected page
    await verifyOnProtectedPage(page)

    // Test session persistence by reloading the page
    await page.reload()

    // Verify we're still on the protected page after reload
    await verifyOnProtectedPage(page)

    // Navigate to home page
    await clickLink(page, 'visit-home-link')
    await verifyOnStartupPage(page)

    // Navigate back to protected page - should work without re-authentication
    await clickLink(page, 'visit-private-link')
    await verifyOnProtectedPage(page)

    // Reload the protected page again
    await page.reload()
    await verifyOnProtectedPage(page)

    // Test multiple reloads
    for (let i = 0; i < 3; i++) {
      await page.reload()
      await verifyOnProtectedPage(page)
    }

    // Navigate to home and back to private again to ensure session is maintained
    await clickLink(page, 'visit-home-link')
    await verifyOnStartupPage(page)
    await clickLink(page, 'visit-private-link')
    await verifyOnProtectedPage(page)

    // Finally, sign out and verify
    await signOutAndVerify(page)

    // After sign out, verify we can't access protected page
    await page.goto('http://localhost:3000/private')
    await verifyOnSignInPage(page)
    await expect(page.getByRole('alert')).toContainText(
      'You must sign in to visit that page'
    )
  }
)
