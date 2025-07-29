import { test, expect } from '@playwright/test'
import { startSignIn } from '../support/auth-helpers'
import { verifyOnStartupPage } from '../support/page-verifiers'
import { fillInput, clickLink } from '../support/finders'
import { PATHS, COOKIES } from '../../src/constants'

test.describe('Email Validation Edge Cases', () => {
  test('rejects email at maximum allowed length (254 chars)', async ({
    page,
  }) => {
    // Start sign in and verify
    await page.goto('http://localhost:3000')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Create an email that's exactly 254 characters
    const localPart = 'a'.repeat(64)
    const domainPart = 'b'.repeat(185)
    const longEmail = `${localPart}@${domainPart}.com`

    // Verify the email is exactly 254 characters
    expect(longEmail.length).toBe(254)

    // Fill the email input
    await fillInput(page, 'email', longEmail)

    // Click submit
    await clickLink(page, 'submit')

    // Verify we're still on the sign-in page (not redirected)
    await expect(page.getByTestId('sign-in-page-banner')).toBeVisible({
      timeout: 2000,
    })
  })

  test('rejects email with maximum local part (64 chars)', async ({ page }) => {
    // Start sign in and verify
    await page.goto('http://localhost:3000')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Create an email with maximum local part (64 chars)
    const localPart = 'a'.repeat(64)
    const validEmail = `${localPart}@example.com`

    // Fill the email input
    await fillInput(page, 'email', validEmail)

    // Click submit
    await clickLink(page, 'submit')

    // Verify we're still on the sign-in page (not redirected)
    await expect(page.getByTestId('sign-in-page-banner')).toBeVisible({
      timeout: 2000,
    })
  })

  test('rejects email with special characters in local part', async ({
    page,
    request,
  }) => {
    // Create an email with special characters in local part
    const email = 'user<tag>123@example.com'

    // Make a direct POST request to the start OTP endpoint with proper CSRF headers
    const response = await request.post(
      'http://localhost:3000' + PATHS.AUTH.START_OTP,
      {
        form: {
          email: email,
        },
        headers: {
          // Set the Origin header to match the allowed origin in the CSRF middleware
          Origin: 'http://localhost:3000',
        },
        failOnStatusCode: false, // Don't fail the test on non-2xx status codes
        maxRedirects: 0, // Don't follow redirects so we can check the status
      }
    )

    // Check that the response is a redirect back to the sign-in page (not to await-code)
    expect(response.status()).toBe(303) // 303 See Other
    expect(response.headers()['location']).toBe(PATHS.AUTH.SIGN_IN)

    // Check the ERROR_FOUND cookie contains the expected error message
    const cookies = response.headers()['set-cookie'] || ''
    expect(cookies).toContain(COOKIES.ERROR_FOUND)

    // Extract the ERROR_FOUND cookie value
    const errorCookieMatch = cookies.match(
      new RegExp(`${COOKIES.ERROR_FOUND}=([^;]+)`)
    )
    expect(errorCookieMatch).not.toBeNull()

    if (errorCookieMatch) {
      const errorMessage = decodeURIComponent(errorCookieMatch[1])
      expect(errorMessage).toBe('Please enter a valid email address')
      console.log(`Error cookie message: ${errorMessage}`)
    }

    // Log the validation result for debugging
    console.log(
      `Email validation test for ${email}: redirected to ${response.headers()['location']}`
    )
  })

  test('accepts standard email format', async ({ page }) => {
    // Start sign in and verify
    await page.goto('http://localhost:3000')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Create a standard email format that should be accepted
    const email = 'fredfred@team439980.testinator.com'

    // Fill the email input
    await fillInput(page, 'email', email)

    // Click submit
    await clickLink(page, 'submit')

    // Verify we're redirected to the await code page
    await expect(page.getByTestId('await-code-page-banner')).toBeVisible({
      timeout: 2000,
    })

    // Cancel to clean up
    await clickLink(page, 'cancel-sign-in-link')
  })
})
