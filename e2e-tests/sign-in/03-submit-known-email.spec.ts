import { test } from '@playwright/test'

import {
  verifyOnStartupPage,
  verifyOnSignInPage,
  verifyOnProtectedPage,
} from '../support/page-verifiers'
import { startSignIn, signUpUser, signInUser, signOutAndVerify } from '../support/auth-helpers'

test('signing up a new user succeeds', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000')
  await verifyOnStartupPage(page)
  await startSignIn(page)
  await verifyOnSignInPage(page)

  // Generate unique email to avoid conflicts with seeded users
  const uniqueEmail = `testuser-${Date.now()}@team439980.testinator.com`
  await signUpUser(page, 'Test User', uniqueEmail, 'testpassword123')
  
  // Should be on protected page after successful signup
  await verifyOnProtectedPage(page)

  // Sign out to reset state
  await signOutAndVerify(page)
})

test('signing in with existing credentials succeeds', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000')
  await verifyOnStartupPage(page)
  
  // Test signing in with a seeded user (from seed-dev.sql)
  // We know this user exists with password 'testpassword123'
  await signInUser(page, 'fredfred@team439980.testinator.com', 'testpassword123')
  
  // Should be on protected page after successful sign-in
  await verifyOnProtectedPage(page)

  // Sign out to clean up
  await signOutAndVerify(page)
})
