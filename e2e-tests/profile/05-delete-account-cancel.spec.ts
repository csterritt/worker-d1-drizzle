import { expect, test } from '@playwright/test'

import { clickLink, verifyElementExists } from '../support/finders'
import {
  verifyOnProfilePage,
  verifyOnDeleteConfirmPage,
  verifyOnProtectedPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { navigateToProfile } from '../support/navigation-helpers'
import { testWithDatabase } from '../support/test-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS, BASE_URLS, ERROR_MESSAGES } from '../support/test-data'

test(
  'can cancel delete account flow and return to profile',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)
    await verifyOnProfilePage(page)

    // Click delete account button
    await clickLink(page, 'delete-account-action')

    // Should be on delete confirmation page
    await verifyOnDeleteConfirmPage(page)
    expect(page.url()).toContain('/profile/delete-confirm')

    // Click cancel button
    await clickLink(page, 'cancel-delete-action')

    // Should be back on profile page
    await verifyOnProfilePage(page)
    expect(page.url()).toContain('/profile')
    expect(page.url()).not.toContain('/delete-confirm')
  })
)

test(
  'can still sign out and sign back in after canceling delete',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Click delete account button
    await clickLink(page, 'delete-account-action')
    await verifyOnDeleteConfirmPage(page)

    // Click cancel button
    await clickLink(page, 'cancel-delete-action')
    await verifyOnProfilePage(page)

    // Sign out
    await clickLink(page, 'sign-out-action')
    await page.waitForTimeout(1000)

    // Sign back in
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Should be successfully signed in
    await verifyOnProtectedPage(page)
  })
)

test('delete confirmation page requires authentication', async ({ page }) => {
  // Try to access delete confirmation page without signing in
  await page.goto(BASE_URLS.PROFILE_DELETE_CONFIRM)

  // Should be redirected to sign-in page
  await verifyOnSignInPage(page)
  expect(page.url()).toContain('/auth/sign-in')
})

test(
  'profile page shows delete account section',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Verify delete account button is visible
    expect(await verifyElementExists(page, 'delete-account-action')).toBe(true)
  })
)
