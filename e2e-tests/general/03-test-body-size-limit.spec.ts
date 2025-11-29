import { test, expect } from '@playwright/test'

import { signOutAndVerify, signInUser } from '../support/auth-helpers'
import { navigateToHome } from '../support/navigation-helpers'
import { testWithDatabase } from '../support/test-helpers'
import { TEST_USERS } from '../support/test-data'
import { HTML_STATUS } from '../../src/constants'

test.describe('Body size limit', () => {
  test(
    'returns 413 status when JSON payload exceeds size limit',
    testWithDatabase(async ({ page, request }) => {
      // First sign in to get a valid session
      await navigateToHome(page)

      // Sign in with known email and password
      await signInUser(
        page,
        TEST_USERS.KNOWN_USER.email,
        TEST_USERS.KNOWN_USER.password
      )

      // Create a large payload (2KB)
      const largePayload = { data: 'X'.repeat(2000) }

      // Attempt to POST to the increment endpoint with the large payload
      const response = await request.post('http://localhost:3000/increment', {
        data: largePayload,
        headers: {
          // Set the Origin header to match the allowed origin in the CSRF middleware
          Origin: 'http://localhost:3000',
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false, // Don't fail the test on non-2xx status codes
      })

      // Verify the response status is 413 Content Too Large
      expect(response.status()).toBe(HTML_STATUS.CONTENT_TOO_LARGE)

      // Verify the response contains the overflow error message
      const responseText = await response.text()
      expect(responseText).toContain('overflow :(')

      // Sign out to clean up the authenticated session
      await signOutAndVerify(page)
    })
  )

  test(
    'returns 413 status when form data payload exceeds size limit',
    testWithDatabase(async ({ page, request }) => {
      // First sign in to get a valid session
      await navigateToHome(page)

      // Sign in with known email and password
      await signInUser(
        page,
        TEST_USERS.KNOWN_USER.email,
        TEST_USERS.KNOWN_USER.password
      )

      // Create form data with a large value (2KB)
      const formData = {
        field1: 'X'.repeat(500),
        field2: 'Y'.repeat(500),
        field3: 'Z'.repeat(1000),
      }

      // Attempt to POST to the increment endpoint with the large form data payload
      const response = await request.post('http://localhost:3000/increment', {
        form: formData,
        headers: {
          // Set the Origin header to match the allowed origin in the CSRF middleware
          Origin: 'http://localhost:3000',
        },
        failOnStatusCode: false, // Don't fail the test on non-2xx status codes
      })

      // Verify the response status is 413 Content Too Large
      expect(response.status()).toBe(HTML_STATUS.CONTENT_TOO_LARGE)

      // Verify the response contains the overflow error message
      const responseText = await response.text()
      expect(responseText).toContain('overflow :(')

      // Sign out to clean up the authenticated session
      await signOutAndVerify(page)
    })
  )

  test(
    'correctly handles payloads at the size limit boundary',
    testWithDatabase(async ({ page, request }) => {
      // First sign in to get a valid session
      await navigateToHome(page)

      // Sign in with known email and password
      await signInUser(
        page,
        TEST_USERS.KNOWN_USER.email,
        TEST_USERS.KNOWN_USER.password
      )

      // Create a payload just under the limit (1023 bytes)
      const justUnderLimitPayload = { data: 'X'.repeat(1023 - 10) } // Subtract 10 bytes to account for JSON formatting

      // Attempt to POST with payload just under the limit
      const underLimitResponse = await request.post(
        'http://localhost:3000/increment',
        {
          data: justUnderLimitPayload,
          headers: {
            Origin: 'http://localhost:3000',
            'Content-Type': 'application/json',
          },
          failOnStatusCode: false,
        }
      )

      // This should succeed (either 200 OK or 303 redirect)
      expect(underLimitResponse.status()).toBe(200)

      // Create a payload just over the limit (1025 bytes)
      const justOverLimitPayload = { data: 'X'.repeat(1025 - 10) } // Subtract 10 bytes to account for JSON formatting

      // Attempt to POST with payload just over the limit
      const overLimitResponse = await request.post(
        'http://localhost:3000/increment',
        {
          data: justOverLimitPayload,
          headers: {
            Origin: 'http://localhost:3000',
            'Content-Type': 'application/json',
          },
          failOnStatusCode: false,
        }
      )

      // This should fail with 413 Content Too Large
      expect(overLimitResponse.status()).toBe(HTML_STATUS.CONTENT_TOO_LARGE)

      // Verify the response contains the overflow error message
      const responseText = await overLimitResponse.text()
      expect(responseText).toContain('overflow :(')

      // Sign out to clean up the authenticated session
      await signOutAndVerify(page)
    })
  )
})
