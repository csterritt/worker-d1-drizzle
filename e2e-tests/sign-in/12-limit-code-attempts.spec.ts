import { test } from '@playwright/test'

import {
  verifyOnStartupPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  submitBadCode,
  submitValidCode,
  signOutAndVerify,
} from '../support/auth-helpers'
import { clickLink, fillInput, verifyAlert } from '../support/finders'

// Generate a wrong code by modifying the correct code
function generateWrongCode(correctCode: string): string {
  // If the code is numeric, add 1 to each digit (wrapping 9 to 0)
  if (/^\d+$/.test(correctCode)) {
    return correctCode
      .split('')
      .map((digit) => (parseInt(digit) + 1) % 10)
      .join('')
  }

  // If the code is alphanumeric, just reverse it
  return correctCode.split('').reverse().join('')
}

test.describe.serial('Code attempt limits', () => {
  test('user can submit wrong code twice and succeed on third attempt', async ({
    page,
  }) => {
    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Capture the response to get the session token from the headers
    let responsePromise = page.waitForResponse('**/auth/**')

    // Submit email to get to the code entry page
    const testEmail = `fredfred@team439980.testinator.com`
    await submitEmail(page, testEmail)

    // Get the response
    let response = await responsePromise

    let headers = response.headers()
    const correctCode = headers['x-session-token']
    console.log('Correct code:', correctCode)

    // Generate an incorrect code
    const wrongCode = generateWrongCode(correctCode)
    console.log('Wrong code:', wrongCode)

    // First attempt - submit wrong code
    await submitBadCode(page, wrongCode)

    // Second attempt - submit wrong code again
    await submitBadCode(page, wrongCode)

    // Third attempt - submit correct code, should succeed
    await submitValidCode(page, correctCode)

    // Sign out and verify we're back on the home page
    await clickLink(page, 'visit-home-link')
    await signOutAndVerify(page)
  })

  test('user is redirected to sign-in page after three wrong code attempts', async ({
    page,
  }) => {
    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Capture the response to get the session token from the headers
    let responsePromise = page.waitForResponse('**/auth/**')

    // Submit email to get to the code entry page
    const testEmail = `fredfred@team439980.testinator.com`
    await submitEmail(page, testEmail)

    // Get the response
    let response = await responsePromise

    let headers = response.headers()
    const correctCode = headers['x-session-token']
    console.log('Correct code:', correctCode)

    // Generate an incorrect code
    const wrongCode = generateWrongCode(correctCode)
    console.log('Wrong code:', wrongCode)

    // First attempt - submit wrong code
    await submitBadCode(page, wrongCode)

    // Second attempt - submit wrong code again
    await submitBadCode(page, wrongCode)

    // Third attempt - submit wrong code again
    // This should redirect to sign-in page with error
    await fillInput(page, 'code', wrongCode)
    await clickLink(page, 'submit')

    // Verify we're redirected to the sign-in page
    await verifyOnSignInPage(page)

    // Verify error message about too many attempts
    await verifyAlert(page, 'Too many failed attempts. Please sign in again.')
  })
})
