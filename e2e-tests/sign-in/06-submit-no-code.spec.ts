import { test } from '@playwright/test'

import { cancelSignIn, startSignIn, submitEmail } from '../support/auth-helpers'
import {
  verifyOnAwaitCodePage,
  verifyOnStartupPage,
} from '../support/page-verifiers'

test('cannot POST empty code for browsers that ignore HTML constraints', async ({
  page,
  request,
  context,
}) => {
  // Start sign in and verify
  await page.goto('http://localhost:3000/home')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email and verify success
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  // Get all cookies in the current context
  const cookies = await context.cookies()

  // Find a specific cookie by name
  const sessionCookie = cookies.find((cookie) => cookie.name === 'SESSION')
  const params = new URLSearchParams()
  params.append('email', 'fredfred@team439980.testinator.com')
  params.append('otp', ' ')

  // Attempt to POST directly to the protected handler
  const response = await request.post('http://localhost:3000/auth/finish-otp', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `SESSION=${sessionCookie?.value}`,
    },
    data: params.toString(),
    failOnStatusCode: false, // Prevent Playwright from throwing on non-2xx status
  })

  // Submit empty code and verify failure
  await verifyOnAwaitCodePage(page)

  // Cancel to reset internal state
  await cancelSignIn(page)
})
