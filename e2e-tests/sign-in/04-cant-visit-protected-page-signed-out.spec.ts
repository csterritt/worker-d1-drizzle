import { test } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { BASE_URLS } from '../support/test-data'

test('cannot visit protected page when signed out', async ({ page }) => {
  // Try to navigate directly to the protected page without being signed in
  await page.goto(BASE_URLS.PRIVATE)

  // Should be redirected to the sign-in page
  await verifyOnSignInPage(page)

  // Should show an error message indicating authentication is required
  await verifyAlert(page, 'You must sign in to visit that page')
})
