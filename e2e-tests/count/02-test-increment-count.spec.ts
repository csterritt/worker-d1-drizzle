import { expect, test } from '@playwright/test'

import {
  signOutAndVerify,
  startSignIn,
  submitEmail,
  submitValidCode,
} from '../support/auth-helpers'
import { clickLink, getElementText, verifyAlert } from '../support/finders'
import { verifyOnStartupPage } from '../support/page-verifiers'

test.describe('Increment count', () => {
  test('cannot increment if not signed in', async ({ request }) => {
    // Attempt to POST directly to the protected handler
    const response = await request.post('http://localhost:3000/increment', {
      failOnStatusCode: false, // Prevent Playwright from throwing on non-2xx status
    })

    // It appears that hono/Cloudflare pages auto-follows redirects for the client,
    // so we can't verify the redirect status code
    expect(response.status()).toBe(403)
  })

  test('increments the count when signed in and shows success message', async ({
    page,
  }) => {
    // Go to home and verify
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Submit known email and verify success
    await submitEmail(page, 'fredfred@team439980.testinator.com')

    // Submit valid code and verify successful sign-in
    await submitValidCode(page, '123456')

    // Sign out to clean up the authenticated session
    await clickLink(page, 'visit-home-link')
    await clickLink(page, 'visit-count-link')

    // Get the current count value
    const beforeText = await getElementText(page, 'count-value')
    expect(beforeText).not.toBeNull()
    const before = beforeText ? parseInt(beforeText, 10) : NaN
    expect(Number.isNaN(before)).toBe(false)

    // Click the increment button
    await clickLink(page, 'increment-count-link')

    // Should be back on the count page
    await expect(page).toHaveURL(/\/count$/)

    // The success message should appear
    await verifyAlert(page, 'Increment successful')

    // The count should be one more than before
    const afterText = await getElementText(page, 'count-value')
    expect(afterText).not.toBeNull()
    const after = afterText ? parseInt(afterText, 10) : NaN
    expect(after).toBe(before + 1)

    // Sign out to clean up the authenticated session
    await clickLink(page, 'visit-home-link')
    await signOutAndVerify(page)
  })
})
