import { test, expect } from '@playwright/test'
import {
  signOutAndVerify,
  startSignIn,
  submitEmail,
  submitCode,
} from '../support/auth-helpers'
import {
  verifyOnProtectedPage,
  verifyOnStartupPage,
} from '../support/page-verifiers'

test('sign out shows success alert', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Sign in successfully
  await startSignIn(page)
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  await submitCode(page, '123456')
  await verifyOnProtectedPage(page)

  // Sign out and verify success alert is shown
  await page.getByTestId('sign-out-link').click()
  
  // Verify the success alert is displayed
  await expect(page.getByRole('alert')).toHaveText('Signed out successfully.')
  
  // Verify we're back on the startup page
  await verifyOnStartupPage(page)
})
