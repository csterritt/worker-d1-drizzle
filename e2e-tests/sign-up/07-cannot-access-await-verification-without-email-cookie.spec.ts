import { test } from '@playwright/test'

import { verifyOnSignInPage } from '../support/page-verifiers'

test('cannot access await verification page without email cookie', async ({ page }) => {
  // Try to directly access the await verification page without an email cookie
  await page.goto('http://localhost:3000/auth/await-verification')

  // Should be redirected to the sign-in page
  await verifyOnSignInPage(page)
})
