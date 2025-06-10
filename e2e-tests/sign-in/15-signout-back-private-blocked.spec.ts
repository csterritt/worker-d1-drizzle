import { test, expect } from '@playwright/test'
import {
  signOutAndVerify,
  startSignIn,
  submitEmail,
  submitCode,
} from '../support/auth-helpers'
import {
  verifyOnProtectedPage,
  verifyOnSignInPage,
  verifyOnStartupPage,
} from '../support/page-verifiers'

test('sign out from private page and back button does not restore access', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/home')
  await startSignIn(page)
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  await submitCode(page, '123456')
  await verifyOnProtectedPage(page)

  // Sign out from the private page
  await signOutAndVerify(page)

  // Simulate browser back button
  await page.goBack()

  // Should NOT be able to access the private page again
  // Should be redirected or blocked
  await expect(page).not.toHaveURL(/.*private.*/)
  await verifyOnSignInPage(page)
})
