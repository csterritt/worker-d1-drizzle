import { expect, test } from '@playwright/test'

import { verifyElementExists } from '../support/finders'
import { navigateToHome } from '../support/navigation-helpers'

test('initial startup page has proper banners', async ({ page }) => {
  // Navigate to startup page
  await navigateToHome(page)
})

test('initial startup page has a sign in link', async ({ page }) => {
  // Navigate to startup page
  await navigateToHome(page)
  expect(await verifyElementExists(page, 'sign-in-link')).toBe(true)
})
