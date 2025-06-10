import { test, expect } from '@playwright/test'
import { verifyOnSignInPage } from '../support/page-verifiers'

test('user with invalid session cookie is treated as unauthenticated', async ({ page, context }) => {
  // Set a bogus session cookie before visiting the private page
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

  // Attempt to visit a private page
  await page.goto('http://localhost:3000/private')

  // Should be redirected to sign-in page (treated as unauthenticated)
  await verifyOnSignInPage(page)
})
