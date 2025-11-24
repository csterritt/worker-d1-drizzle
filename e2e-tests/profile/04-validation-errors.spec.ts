import { test } from '@playwright/test'

import { clickLink, verifyAlert, fillInput } from '../support/finders'
import { verifyOnProfilePage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToProfile } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

test(
  'shows error when current password is empty',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Fill only new passwords
    await fillInput(page, 'new-password-input', 'newpassword123')
    await fillInput(page, 'confirm-password-input', 'newpassword123')
    await clickLink(page, 'change-password-action')

    // Should show error
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'Current password is required.')
  })
)

test(
  'shows error when new password is empty',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Fill only current password
    await fillInput(
      page,
      'current-password-input',
      TEST_USERS.KNOWN_USER.password
    )
    await clickLink(page, 'change-password-action')

    // Should show error
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'Password must be at least 8 characters long.')
  })
)

test(
  'shows error when confirm password is empty',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Fill current and new password but not confirm
    await fillInput(
      page,
      'current-password-input',
      TEST_USERS.KNOWN_USER.password
    )
    await fillInput(page, 'new-password-input', 'newpassword123')
    await clickLink(page, 'change-password-action')

    // Should show error
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'Password must be at least 8 characters long.')
  })
)

test(
  'accepts empty user info field',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Fill form without user info
    await fillInput(
      page,
      'current-password-input',
      TEST_USERS.KNOWN_USER.password
    )
    await fillInput(page, 'new-password-input', 'anotherpassword456')
    await fillInput(page, 'confirm-password-input', 'anotherpassword456')
    await clickLink(page, 'change-password-action')

    // Should succeed
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'Your password has been successfully changed.')
  })
)
