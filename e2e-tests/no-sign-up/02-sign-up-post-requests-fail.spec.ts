import { test, expect } from '@playwright/test'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateTo404Route } from '../support/navigation-helpers'

test.describe('No Sign-Up Mode: POST requests to sign-up handlers fail', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('NO_SIGN_UP')
  })

  test('POST to /auth/sign-up returns 404 page', async ({ page }) => {
    // Make a POST request to the sign-up endpoint
    const response = await page.request.post(
      'http://localhost:3000/auth/sign-up',
      {
        data: {
          email: 'test@example.com',
          password: 'test-password-123',
        },
      }
    )

    // Should get a 200 status (404 page returns 200 with 404 content)
    expect(response.status()).toBe(200)

    // Navigate to see the 404 page content
    await navigateTo404Route(page, '/auth/sign-up')
  })

  test('POST to /auth/resend-email returns 404 page', async ({ page }) => {
    // Make a POST request to the resend-email endpoint
    const response = await page.request.post(
      'http://localhost:3000/auth/resend-email',
      {
        data: {
          email: 'test@example.com',
        },
      }
    )

    // Should get a 200 status (404 page returns 200 with 404 content)
    expect(response.status()).toBe(200)

    // Navigate to see the 404 page content
    await navigateTo404Route(page, '/auth/resend-email')
  })
})
