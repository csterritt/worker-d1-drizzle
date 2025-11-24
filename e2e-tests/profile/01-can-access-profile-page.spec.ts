import { expect, test } from '@playwright/test'

import { clickLink, isElementVisible, getElementText } from '../support/finders'
import {
  verifyOnProfilePage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { navigateToProfile } from '../support/navigation-helpers'
import { testWithDatabase } from '../support/test-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

test(
  'can access profile page from user menu when authenticated',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Click the Profile link
    await clickLink(page, 'visit-profile-action')

    // Should be on profile page
    await verifyOnProfilePage(page)
    expect(page.url()).toContain('/profile')
  })
)

test(
  'profile page displays user name and email',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Verify user information is displayed
    const displayedName = await getElementText(page, 'profile-name')
    const displayedEmail = await getElementText(page, 'profile-email')

    expect(displayedName).toBe(TEST_USERS.KNOWN_USER.name)
    expect(displayedEmail).toBe(TEST_USERS.KNOWN_USER.email)
  })
)

test(
  'profile page shows change password form',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Verify all form elements are present
    expect(await isElementVisible(page, 'current-password-input')).toBe(true)
    expect(await isElementVisible(page, 'new-password-input')).toBe(true)
    expect(await isElementVisible(page, 'confirm-password-input')).toBe(true)
    expect(await isElementVisible(page, 'change-password-action')).toBe(true)
  })
)

test(
  'profile page shows humorous question',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Verify humorous question is displayed
    const question = await getElementText(page, 'humorous-question')
    expect(question).toBeTruthy()
    expect(question!.length).toBeGreaterThan(10)
  })
)

test('redirects to sign-in when not authenticated', async ({ page }) => {
  // Try to access profile page without signing in
  await page.goto(BASE_URLS.PROFILE)

  // Should be redirected to sign-in page
  await verifyOnSignInPage(page)
  expect(page.url()).toContain('/auth/sign-in')
})
