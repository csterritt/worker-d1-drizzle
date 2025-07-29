import { test, expect } from '@playwright/test'
import {
  signOutAndVerify,
  startSignIn,
  submitEmail,
  submitCode,
} from '../support/auth-helpers'
import {
  verifyOnProtectedPage,
  verifyOnStartupPage,
} from '../support/page-verifiers'

test('signed-in user visiting /auth/sign-in is redirected to home', async ({
  page,
}) => {
  await page.goto('http://localhost:3000')
  await startSignIn(page)

  // Capture the response to get the session token from the headers
  const responsePromise = page.waitForResponse('**/auth/**')
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  const response = await responsePromise
  const code = response.headers()['x-session-token']
  expect(code).toBeTruthy()

  await submitCode(page, code)
  await verifyOnProtectedPage(page)

  // Now try to visit the sign-in page again
  await page.goto('http://localhost:3000/auth/sign-in')

  // Should be redirected to the home page (startup)
  await verifyOnProtectedPage(page)

  // Sign out and verify
  await signOutAndVerify(page)
})

test('signed-in user visiting /auth/await-code is redirected to home', async ({
  page,
}) => {
  await page.goto('http://localhost:3000')
  await startSignIn(page)

  // Capture the response to get the session token from the headers
  const responsePromise = page.waitForResponse('**/auth/**')
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  const response = await responsePromise
  const code = response.headers()['x-session-token']
  expect(code).toBeTruthy()

  await submitCode(page, code)
  await verifyOnProtectedPage(page)

  // Now try to visit the await-code page again
  await page.goto('http://localhost:3000/auth/await-code')

  // Should be redirected to the home page (startup)
  await verifyOnProtectedPage(page)

  // Sign out and verify
  await signOutAndVerify(page)
})
