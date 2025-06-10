import { test, expect } from '@playwright/test'
import { cancelSignIn, startSignIn, submitEmail } from '../support/auth-helpers'
import { verifyOnAwaitCodePage } from '../support/page-verifiers'

// Verifies that when a user is on the await code page, hitting the browser's back button does NOT take them back to the email entry page

test('back button does not leave await code page after submitting email', async ({
  page,
}) => {
  await page.goto('http://localhost:3000/home')
  await startSignIn(page)
  const testEmail = 'fredfred@team439980.testinator.com'
  await submitEmail(page, testEmail)

  // Simulate pressing the browser's back button
  await page.goBack()

  // Should still be on the await code page
  await verifyOnAwaitCodePage(page)

  // Optionally, check that the sign-in page's email field is NOT visible
  await expect(page.getByLabel('Email')).not.toBeVisible()

  await cancelSignIn(page)
})
