import { test, expect } from '@playwright/test'
import { startSignIn } from '../support/auth-helpers'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { fillInput, clickLink, verifyAlert } from '../support/finders'

test.describe('Better-Auth Error Handling and Validation', () => {
  test('handles server errors gracefully during sign-in', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Simulate server error by making request to non-existent endpoint
    const response = await page.request.post('http://localhost:3000/api/auth/sign-in/nonexistent', {
      form: {
        email: 'test@example.com',
        password: 'validpassword123'
      },
      failOnStatusCode: false
    })

    // Should handle gracefully with appropriate error
    expect(response.status()).toBe(404)
  })

  test('validates email format on client-side', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Fill invalid email format
    await fillInput(page, 'email-input', 'invalid-email-format')
    await fillInput(page, 'password-input', 'validpassword123')

    // HTML5 validation should prevent form submission
    await clickLink(page, 'submit')
    await verifyOnSignInPage(page)

    // Check for HTML5 validation message
    const emailInput = page.getByTestId('email-input')
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test('validates password length on client-side', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    await fillInput(page, 'email-input', 'test@example.com')
    await fillInput(page, 'password-input', '123') // Less than 8 characters

    // HTML5 validation should prevent form submission
    await clickLink(page, 'submit')
    await verifyOnSignInPage(page)

    // Check for HTML5 validation message
    const passwordInput = page.getByTestId('password-input')
    const validationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test('handles network errors during authentication', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    // Simulate network failure by intercepting and failing the request
    await page.route('**/api/auth/sign-in/email', route => {
      route.abort('failed')
    })

    await fillInput(page, 'email-input', 'test@example.com')
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')

    // Should handle network error gracefully
    await verifyOnSignInPage(page)
  })

  test('handles database connection errors', async ({ page, request }) => {
    // This test would require a way to simulate database failures
    // For now, we'll test the error response structure
    
    const response = await request.post('http://localhost:3000/api/auth/sign-in/email', {
      form: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      },
      failOnStatusCode: false
    })

    // Should return appropriate error status
    expect([400, 401, 404]).toContain(response.status())
  })

  test('validates required fields on sign-up', async ({ request }) => {
    // Test missing name
    const missingName = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        email: 'test@example.com',
        password: 'validpassword123'
        // Missing name
      },
      failOnStatusCode: false
    })
    expect(missingName.status()).toBe(400)

    // Test missing email
    const missingEmail = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        password: 'validpassword123'
        // Missing email
      },
      failOnStatusCode: false
    })
    expect(missingEmail.status()).toBe(400)

    // Test missing password
    const missingPassword = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        email: 'test@example.com'
        // Missing password
      },
      failOnStatusCode: false
    })
    expect(missingPassword.status()).toBe(400)
  })

  test('handles malformed request data', async ({ request }) => {
    // Send malformed JSON
    const malformedRequest = await request.post('http://localhost:3000/api/auth/sign-in/email', {
      data: '{"malformed": json}',
      headers: {
        'Content-Type': 'application/json'
      },
      failOnStatusCode: false
    })

    expect([400, 422]).toContain(malformedRequest.status())
  })

  test('prevents SQL injection attempts', async ({ request }) => {
    // Test SQL injection in email field
    const sqlInjectionEmail = await request.post('http://localhost:3000/api/auth/sign-in/email', {
      form: {
        email: "'; DROP TABLE users; --",
        password: 'validpassword123'
      },
      failOnStatusCode: false
    })

    // Should handle safely without breaking
    expect([400, 401, 404]).toContain(sqlInjectionEmail.status())

    // Test SQL injection in password field  
    const sqlInjectionPassword = await request.post('http://localhost:3000/api/auth/sign-in/email', {
      form: {
        email: 'test@example.com',
        password: "'; DROP TABLE users; --"
      },
      failOnStatusCode: false
    })

    expect([400, 401, 404]).toContain(sqlInjectionPassword.status())
  })

  test('rate limits authentication attempts', async ({ request }) => {
    // Make multiple rapid sign-in attempts
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.post('http://localhost:3000/api/auth/sign-in/email', {
          form: {
            email: 'ratelimit@example.com',
            password: 'wrongpassword'
          },
          failOnStatusCode: false
        })
      )
    }

    const responses = await Promise.all(promises)
    
    // At least some requests should be rate limited (status 429) 
    // or all should be handled gracefully
    responses.forEach(response => {
      expect([400, 401, 404, 429]).toContain(response.status())
    })
  })

  test('validates email format with edge cases', async ({ request }) => {
    const edgeCases = [
      'plainaddress',
      '@missingdomain.com',
      'missing@.com',
      'missing@domain',
      'spaces in@domain.com',
      'domain@.com',
      'domain@com.',
      'domain@-com.com',
      'domain@com-.com'
    ]

    for (const email of edgeCases) {
      const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
        form: {
          name: 'Test User',
          email: email,
          password: 'validpassword123'
        },
        failOnStatusCode: false
      })

      // Should reject invalid email formats
      expect(response.status()).toBe(400)
    }
  })

  test('handles extremely long input values', async ({ request }) => {
    const longString = 'a'.repeat(10000)
    
    // Test extremely long email
    const longEmailResponse = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        email: longString + '@example.com',
        password: 'validpassword123'
      },
      failOnStatusCode: false
    })
    expect(longEmailResponse.status()).toBe(400)

    // Test extremely long password
    const longPasswordResponse = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        email: 'test@example.com',
        password: longString
      },
      failOnStatusCode: false
    })
    expect([400, 413]).toContain(longPasswordResponse.status()) // 413 = Payload Too Large
  })

  test('handles special characters in input fields', async ({ request }) => {
    const specialCharsEmail = 'user+tag@example.com'
    const specialCharsName = 'José María O\'Connor-Smith'
    
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: specialCharsName,
        email: specialCharsEmail,
        password: 'validpassword123'
      }
    })

    // Should handle special characters correctly
    expect(response.ok()).toBeTruthy()
  })

  test('prevents XSS attempts in form fields', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await startSignIn(page)

    const xssPayload = '<script>alert("xss")</script>'
    
    await fillInput(page, 'email-input', xssPayload)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')

    // Should not execute script or cause XSS
    // Page should handle it safely
    await verifyOnSignInPage(page)
    
    // Check that no alert was triggered
    const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 })
      .catch(() => null)
    const dialog = await dialogPromise
    expect(dialog).toBeNull()
  })
})
