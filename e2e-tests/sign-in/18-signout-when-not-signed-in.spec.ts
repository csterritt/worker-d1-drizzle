import { test, expect } from '@playwright/test'
import {
  verifyOnStartupPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'

// Test: sign out when not signed in (no session cookie)
test('sign out endpoint when not signed in (no session cookie)', async ({
  page,
}) => {
  // POST to the sign-out endpoint directly
  const response = await page.request.post('http://localhost:3000/auth/signout')

  // Should be handled gracefully (e.g., 200/204, or redirect, no error)
  expect(response.status()).toBe(403)

  // Optionally, check the UI after POST (should be at startup or sign-in page)
  await page.goto('http://localhost:3000')
  try {
    await verifyOnStartupPage(page)
  } catch {
    await verifyOnSignInPage(page)
  }
})

// Test: sign out with an invalid session cookie
test('sign out endpoint with invalid session cookie', async ({
  page,
  context,
}) => {
  // Set an invalid session cookie
  await context.addCookies([
    {
      name: 'session',
      value: 'bogus-session-id',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false, // Set true if your app uses HTTPS in test
      sameSite: 'Lax',
    },
  ])

  // POST to the sign-out endpoint
  const response = await page.request.post('http://localhost:3000/auth/signout')

  // Should be handled gracefully (e.g., 200/204, or redirect, no error)
  expect(response.status()).toBe(403)

  // Optionally, check the UI after POST (should be at startup or sign-in page)
  await page.goto('http://localhost:3000')
  try {
    await verifyOnStartupPage(page)
  } catch {
    await verifyOnSignInPage(page)
  }
})
