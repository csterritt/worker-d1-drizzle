import { expect, test } from '@playwright/test'

import { clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnProfilePage,
  verifyOnDeleteConfirmPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { navigateToProfile } from '../support/navigation-helpers'
import { testWithDatabase } from '../support/test-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS, BASE_URLS, ERROR_MESSAGES } from '../support/test-data'

test(
  'can delete account and cannot sign in with deleted credentials',
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

    // Click confirm delete button
    await clickLink(page, 'confirm-delete-action')

    // Should be redirected to sign-in page with success message
    await verifyOnSignInPage(page)
    await verifyAlert(page, ERROR_MESSAGES.ACCOUNT_DELETED)

    // Try to sign in with deleted credentials
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Should stay on sign-in page with error
    await verifyOnSignInPage(page)
    await verifyAlert(page, ERROR_MESSAGES.INVALID_CREDENTIALS)
  })
)

test(
  'delete confirmation page shows warning message',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Click delete account button
    await clickLink(page, 'delete-account-action')

    // Should be on delete confirmation page
    await verifyOnDeleteConfirmPage(page)

    // Verify warning elements are present
    const pageContent = await page.content()
    expect(pageContent).toContain('Are you absolutely sure?')
    expect(pageContent).toContain('This action cannot be undone')
  })
)
