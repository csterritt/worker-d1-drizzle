import { test, expect } from '@playwright/test'
import {
  startSignIn,
  submitEmail,
  submitCode,
  signOutAndVerify,
} from '../support/auth-helpers'
import {
  verifyOnProtectedPage,
  verifyOnStartupPage,
} from '../support/page-verifiers'

// This test assumes the test server always accepts '123456' as a valid OTP

test('signed-in user tries to start new OTP flow', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await startSignIn(page)
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  await submitCode(page, '123456')
  await verifyOnProtectedPage(page)

  // Try to POST to /auth/start-otp again while signed in
  await page.request.post('http://localhost:3000/auth/start-otp', {
    form: {
      email: 'fredfred@team439980.testinator.com',
    },
  })

  await verifyOnProtectedPage(page)
  await signOutAndVerify(page)
})
