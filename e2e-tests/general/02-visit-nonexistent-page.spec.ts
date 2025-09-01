import { test } from '@playwright/test'

import { clickLink } from '../support/finders'
import { verifyOnStartupPage } from '../support/page-verifiers'
import { navigateTo404Route } from '../support/navigation-helpers'

test('a bad path redirects to a proper 404 page', async ({ page }) => {
  // Navigate to nonexistent page
  await navigateTo404Route(page, '/this/path/does/not/exist')
})

test('return to home from 404 page works', async ({ page }) => {
  // Navigate to nonexistent page and return home
  await navigateTo404Route(page, '/this/path/does/not/exist')
  await clickLink(page, 'home-link')
  await verifyOnStartupPage(page)
})
