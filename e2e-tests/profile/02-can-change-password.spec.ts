import { test } from '@playwright/test'

import { clickLink, verifyAlert } from '../support/finders'
import {
  verifyOnSignInPage,
  verifyOnProfilePage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToProfile } from '../support/navigation-helpers'
import {
  submitChangePasswordForm,
  submitSignInForm,
} from '../support/form-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

test(
  'can successfully change password',
  testWithDatabase(async ({ page }) => {
    const currentPassword = TEST_USERS.KNOWN_USER.password
    const newPassword = 'my-brand-new-password-123'

    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Submit change password form
    await submitChangePasswordForm(page, currentPassword, newPassword)

    // Should stay on profile page with success message
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'Your password has been successfully changed.')

    // Sign out
    await clickLink(page, 'sign-out-action')
    await page.waitForTimeout(1000)

    // Try to sign in with new password
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, {
      email: TEST_USERS.KNOWN_USER.email,
      password: newPassword,
    })

    // Should be successfully signed in
    await verifyOnProtectedPage(page)
    await verifyAlert(page, 'Welcome! You have been signed in successfully.')

    // Sign out again
    await clickLink(page, 'sign-out-action')
    await page.waitForTimeout(1000)

    // Verify old password no longer works
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, {
      email: TEST_USERS.KNOWN_USER.email,
      password: currentPassword,
    })

    // Should stay on sign-in page with error
    await verifyOnSignInPage(page)
    await verifyAlert(
      page,
      'Invalid email or password. Please check your credentials and try again.'
    )
  })
)

test(
  'shows error when current password is incorrect',
  testWithDatabase(async ({ page }) => {
    const wrongPassword = 'definitely-wrong-password'
    const newPassword = 'my-new-password-789'

    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Submit change password form with wrong current password
    await submitChangePasswordForm(page, wrongPassword, newPassword)

    // Should stay on profile page with error message
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'Current password is incorrect. Please try again.')
  })
)

test(
  'shows error when new passwords do not match',
  testWithDatabase(async ({ page }) => {
    const currentPassword = TEST_USERS.KNOWN_USER.password

    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Fill form with mismatched passwords
    await page.getByTestId('current-password-input').fill(currentPassword)
    await page.getByTestId('new-password-input').fill('password123')
    await page.getByTestId('confirm-password-input').fill('password456')
    await clickLink(page, 'change-password-action')

    // Should stay on profile page with error message
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'New passwords do not match. Please try again.')
  })
)

test(
  'shows error when new password is too short',
  testWithDatabase(async ({ page }) => {
    const currentPassword = TEST_USERS.KNOWN_USER.password
    const shortPassword = 'short'

    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Submit change password form with short password
    await submitChangePasswordForm(page, currentPassword, shortPassword)

    // Should stay on profile page with error message
    await verifyOnProfilePage(page)
    await verifyAlert(page, 'Password must be at least 8 characters long.')
  })
)
