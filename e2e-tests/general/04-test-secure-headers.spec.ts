import { test, expect } from '@playwright/test'
import { signOutAndVerify, signInUser } from '../support/auth-helpers'
import { navigateToHome } from '../support/navigation-helpers'

import { testWithDatabase } from '../support/test-helpers'

test.describe('Security Headers', () => {
  test('server sets appropriate security headers on responses', async ({
    page,
    request,
  }) => {
    // Get the response headers - bit of a hack, the root page doesn't get automatic headers
    // in development, so we use a non-existent page
    const response = await request.get('http://localhost:3000/auth/sign-in')
    const headers = response.headers()

    // Verify security headers are present and have appropriate values
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(headers['x-xss-protection']).toBe('0')

    // Note: Content-Security-Policy is not set in the current configuration
    // Strict-Transport-Security is typically only set in production environments
  })

  test(
    'server rejects requests with invalid CSRF headers',
    testWithDatabase(async ({ page, request }) => {
      // First sign in to get a valid session
      await navigateToHome(page)

      // Sign in with known email and password
      await signInUser(
        page,
        'fredfred@team439980.testinator.com',
        'freds-clever-password'
      )

      // Try to POST to the increment endpoint with an invalid Origin header
      const invalidOriginResponse = await request.post(
        'http://localhost:3000/increment',
        {
          headers: {
            Origin: 'https://malicious-site.com', // Invalid origin
          },
          failOnStatusCode: false,
        }
      )

      // Verify the request is rejected with a 403 Forbidden status
      expect(invalidOriginResponse.status()).toBe(403)

      // Try to POST without any Origin header
      const noOriginResponse = await request.post(
        'http://localhost:3000/increment',
        {
          headers: {
            // No Origin header
          },
          failOnStatusCode: false,
        }
      )

      // Verify the request is rejected with a 403 Forbidden status
      expect(noOriginResponse.status()).toBe(403)

      // Try with a valid Origin to confirm the CSRF protection is working correctly
      const validOriginResponse = await request.post(
        'http://localhost:3000/increment',
        {
          headers: {
            Origin: 'http://localhost:3000', // Valid origin
          },
          failOnStatusCode: false,
        }
      )

      // This should succeed (not be rejected due to CSRF)
      expect(validOriginResponse.status()).not.toBe(403)

      // Sign out to clean up the authenticated session
      await signOutAndVerify(page)
    })
  )

  test('security headers are consistent across different endpoints', async ({
    request,
  }) => {
    // Test multiple endpoints to ensure headers are consistent
    const endpoints = [
      '/', // Home page
      '/auth/sign-in', // Sign-in page
    ]

    // Store headers from the first endpoint as a reference
    const firstResponse = await request.get(
      `http://localhost:3000${endpoints[0]}`
    )
    const referenceHeaders = {
      'referrer-policy': firstResponse.headers()['referrer-policy'],
      'x-content-type-options':
        firstResponse.headers()['x-content-type-options'],
      'x-frame-options': firstResponse.headers()['x-frame-options'],
      'x-xss-protection': firstResponse.headers()['x-xss-protection'],
    }

    console.log(`referenceHeaders: ${JSON.stringify(referenceHeaders)}`)

    // Check that all other endpoints have the same security headers
    for (let i = 1; i < endpoints.length; i++) {
      const response = await request.get(`http://localhost:3000${endpoints[i]}`)
      const headers = response.headers()

      expect(headers['referrer-policy']).toBe(
        referenceHeaders['referrer-policy']
      )
      expect(headers['x-content-type-options']).toBe(
        referenceHeaders['x-content-type-options']
      )
      expect(headers['x-frame-options']).toBe(
        referenceHeaders['x-frame-options']
      )
      expect(headers['x-xss-protection']).toBe(
        referenceHeaders['x-xss-protection']
      )
    }
  })
})
