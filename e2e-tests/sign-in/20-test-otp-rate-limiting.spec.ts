import { test, expect } from '@playwright/test'
import {
  verifyOnStartupPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { startSignIn } from '../support/auth-helpers'
import { deleteAllUserSessions } from '../../src/lib/db-access'

// This test verifies that the handleStartOtp endpoint has rate limiting
// It should return a 429 error if called more than three times in a five minute period

// Function to submit the email and get the response
async function submitEmailAndGetResponse(request: any, testEmail: string) {
  const response = await request.post('http://localhost:3000/auth/start-otp', {
    form: {
      email: testEmail,
    },
    headers: {
      // Set the Origin header to match the allowed origin in the CSRF middleware
      Origin: 'http://localhost:3000',
    },
    failOnStatusCode: false, // Don't fail the test on non-2xx status codes
    maxRedirects: 0, // Don't follow redirects so we can check the status
  })
  return response
}

test.describe('OTP Rate Limiting', () => {
  test('limits OTP requests to 3 per 5 minutes for the same email', async ({
    page,
    request,
  }) => {
    const testEmail = 'rate-limit-user1@team439980.testinator.com'
    try {
      // Navigate to startup page and verify
      await page.goto('http://localhost:3000/home')
      await verifyOnStartupPage(page)

      // Start sign in process
      await startSignIn(page)
      await verifyOnSignInPage(page)

      // Reset rate limiting for this email before starting the test
      await request.post(`http://localhost:3000/auth/start-otp`, {
        form: {
          email: testEmail,
        },
        headers: {
          Origin: 'http://localhost:3000',
        },
        maxRedirects: 0,
      })

      // First three requests should succeed (status 303 - See Other)
      for (let i = 0; i < 3; i++) {
        const response = await submitEmailAndGetResponse(request, testEmail)
        expect(response.status()).toBe(303) // Redirect status
        console.log(`Request ${i + 1}: Status ${response.status()}`)
      }

      // Fourth request should be rate limited (status 429 - Too Many Requests)
      const rateLimitedResponse = await submitEmailAndGetResponse(
        request,
        testEmail
      )
      expect(rateLimitedResponse.status()).toBe(429) // Too Many Requests
      console.log(`Request 4: Status ${rateLimitedResponse.status()}`)

      // Verify the response contains a message about rate limiting
      const responseBody = await rateLimitedResponse.text()
      expect(responseBody).toContain('rate limit')

      // Optional: Verify the Retry-After header exists
      const retryAfter = rateLimitedResponse.headers()['retry-after']
      expect(retryAfter).toBeTruthy()
    } finally {
      // Clean up after the test
      await page.goto(`http://localhost:3000/auth/clean-sessions/${testEmail}`)
    }
  })

  test('different email addresses are not affected by rate limiting of other emails', async ({
    page,
    request,
  }) => {
    const firstEmail = 'rate-limit-user1@team439980.testinator.com'
    const secondEmail = 'rate-limit-user2@team439980.testinator.com'

    try {
      // Reset rate limiting for both emails before starting the test
      await request.post(`http://localhost:3000/auth/start-otp`, {
        form: {
          email: firstEmail,
        },
        headers: {
          Origin: 'http://localhost:3000',
        },
        maxRedirects: 0,
      })

      await request.post(`http://localhost:3000/auth/start-otp`, {
        form: {
          email: secondEmail,
        },
        headers: {
          Origin: 'http://localhost:3000',
        },
        maxRedirects: 0,
      })

      // Submit 3 requests with the first email
      for (let i = 0; i < 3; i++) {
        await submitEmailAndGetResponse(request, firstEmail)
      }

      // Fourth request with first email should be rate limited
      const rateLimitedResponse = await submitEmailAndGetResponse(
        request,
        firstEmail
      )
      expect(rateLimitedResponse.status()).toBe(429)

      // But a request with a different email should still succeed
      const differentEmailResponse = await submitEmailAndGetResponse(
        request,
        secondEmail
      )
      expect(differentEmailResponse.status()).toBe(303) // Should redirect, not be rate limited
    } finally {
      // Clean up after the test
      await page.goto(`http://localhost:3000/auth/clean-sessions/${firstEmail}`)
      await page.goto(
        `http://localhost:3000/auth/clean-sessions/${secondEmail}`
      )
    }
  })
})
