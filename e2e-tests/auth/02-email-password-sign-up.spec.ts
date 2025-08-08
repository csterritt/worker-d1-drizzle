import { test, expect } from '@playwright/test'
import { verifyOnSignInPage, verifyOnProtectedPage } from '../support/page-verifiers'
import { fillInput, clickLink } from '../support/finders'

test.describe('Better-Auth Email/Password Sign Up', () => {
  test('successful sign-up with valid credentials', async ({ page, request }) => {
    // Generate unique email for this test
    const timestamp = Date.now()
    const testEmail = `test.user.${timestamp}@example.com`
    
    // Make direct API call to sign-up endpoint
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Should get successful response
    expect(response.ok()).toBeTruthy()
    
    // Now test sign-in with the newly created account
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')

    // Should be able to sign in successfully
    await verifyOnProtectedPage(page)
  })

  test('sign-up fails with invalid email format', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        email: 'not-an-email',
        password: 'validpassword123'
      },
      failOnStatusCode: false
    })

    // Should fail with bad request
    expect(response.status()).toBe(400)
  })

  test('sign-up fails with missing name', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        email: 'test@example.com',
        password: 'validpassword123'
        // Missing name field
      },
      failOnStatusCode: false
    })

    // Should fail with bad request
    expect(response.status()).toBe(400)
  })

  test('sign-up fails with password too short', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // Less than 8 characters
      },
      failOnStatusCode: false
    })

    // Should fail with bad request
    expect(response.status()).toBe(400)
  })

  test('sign-up fails with duplicate email', async ({ request }) => {
    const testEmail = 'duplicate@example.com'
    
    // First sign-up should succeed
    const firstResponse = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'First User',
        email: testEmail,
        password: 'validpassword123'
      },
      failOnStatusCode: false
    })

    // Second sign-up with same email should fail
    const secondResponse = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Second User',
        email: testEmail,
        password: 'anotherpassword123'
      },
      failOnStatusCode: false
    })

    // First should succeed, second should fail
    expect(firstResponse.ok()).toBeTruthy()
    expect(secondResponse.status()).toBe(400)
  })

  test('sign-up fails with missing email', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        password: 'validpassword123'
        // Missing email field
      },
      failOnStatusCode: false
    })

    // Should fail with bad request
    expect(response.status()).toBe(400)
  })

  test('sign-up fails with missing password', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Test User',
        email: 'test@example.com'
        // Missing password field
      },
      failOnStatusCode: false
    })

    // Should fail with bad request
    expect(response.status()).toBe(400)
  })

  test('sign-up creates user with correct data structure', async ({ request }) => {
    const timestamp = Date.now()
    const testEmail = `structure.test.${timestamp}@example.com`
    
    const response = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Structure Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    expect(response.ok()).toBeTruthy()
    
    // Check response contains user data
    const responseData = await response.json()
    expect(responseData).toHaveProperty('user')
    expect(responseData.user).toHaveProperty('email', testEmail)
    expect(responseData.user).toHaveProperty('name', 'Structure Test User')
    expect(responseData.user).toHaveProperty('id')
    expect(responseData).toHaveProperty('session')
  })
})
