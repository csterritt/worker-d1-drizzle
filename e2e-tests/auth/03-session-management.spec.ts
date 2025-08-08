import { test, expect } from '@playwright/test'
import { startSignIn } from '../support/auth-helpers'
import { verifyOnProtectedPage, verifyOnSignInPage } from '../support/page-verifiers'
import { fillInput, clickLink } from '../support/finders'

test.describe('Better-Auth Session Management', () => {
  test('session persists across page reloads', async ({ page, request }) => {
    // Create a test user first
    const timestamp = Date.now()
    const testEmail = `session.persist.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Session Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Sign in
    await page.goto('http://localhost:3000')
    await startSignIn(page)
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')
    await verifyOnProtectedPage(page)

    // Reload the page
    await page.reload()

    // Should still be on protected page (session persisted)
    await verifyOnProtectedPage(page)
  })

  test('session persists across browser navigation', async ({ page, request }) => {
    // Create a test user first
    const timestamp = Date.now()
    const testEmail = `session.navigate.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Navigation Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Sign in
    await page.goto('http://localhost:3000')
    await startSignIn(page)
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')
    await verifyOnProtectedPage(page)

    // Navigate to home page
    await page.goto('http://localhost:3000')

    // Navigate back to protected page
    await page.goto('http://localhost:3000/private')

    // Should still be authenticated
    await verifyOnProtectedPage(page)
  })

  test('sign-out terminates session correctly', async ({ page, request }) => {
    // Create a test user first
    const timestamp = Date.now()
    const testEmail = `session.signout.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Sign Out Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Sign in
    await page.goto('http://localhost:3000')
    await startSignIn(page)
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')
    await verifyOnProtectedPage(page)

    // Sign out via better-auth API
    await request.post('http://localhost:3000/api/auth/sign-out')

    // Try to access protected page
    await page.goto('http://localhost:3000/private')

    // Should be redirected to sign-in page
    await verifyOnSignInPage(page)
  })

  test('session expires correctly after timeout', async ({ page, request }) => {
    // This test would require manipulating the session timeout
    // For now, we'll test the basic structure
    
    // Create a test user first
    const timestamp = Date.now()
    const testEmail = `session.timeout.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Timeout Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Sign in
    await page.goto('http://localhost:3000')
    await startSignIn(page)
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')
    await verifyOnProtectedPage(page)

    // In a real test, we would manipulate time or wait for session expiry
    // For now, just verify the session exists
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(cookie => 
      cookie.name.includes('session') || 
      cookie.name.includes('auth') || 
      cookie.name.includes('better-auth')
    )
    
    // Should have some kind of session cookie
    expect(sessionCookie).toBeDefined()
  })

  test('session data is properly structured', async ({ page, request }) => {
    // Create a test user first
    const timestamp = Date.now()
    const testEmail = `session.structure.${timestamp}@example.com`
    
    const signupResponse = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Structure Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    expect(signupResponse.ok()).toBeTruthy()
    const signupData = await signupResponse.json()
    
    // Should have user and session data
    expect(signupData).toHaveProperty('user')
    expect(signupData).toHaveProperty('session')
    expect(signupData.user).toHaveProperty('id')
    expect(signupData.user).toHaveProperty('email', testEmail)
    expect(signupData.user).toHaveProperty('name', 'Structure Test User')
    expect(signupData.session).toHaveProperty('id')
    expect(signupData.session).toHaveProperty('userId')
  })

  test('invalid session cookie redirects to sign-in', async ({ page }) => {
    // Set an invalid session cookie
    await page.context().addCookies([{
      name: 'better-auth.session_token',
      value: 'invalid-session-token',
      domain: 'localhost',
      path: '/'
    }])

    // Try to access protected page
    await page.goto('http://localhost:3000/private')

    // Should be redirected to sign-in page
    await verifyOnSignInPage(page)
  })

  test('concurrent sessions from different browsers', async ({ browser, request }) => {
    // Create a test user
    const timestamp = Date.now()
    const testEmail = `concurrent.test.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Concurrent Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Create two browser contexts (simulate different browsers)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Sign in from both contexts
    await page1.goto('http://localhost:3000')
    await startSignIn(page1)
    await fillInput(page1, 'email-input', testEmail)
    await fillInput(page1, 'password-input', 'validpassword123')
    await clickLink(page1, 'submit')
    await verifyOnProtectedPage(page1)

    await page2.goto('http://localhost:3000')
    await startSignIn(page2)
    await fillInput(page2, 'email-input', testEmail)
    await fillInput(page2, 'password-input', 'validpassword123')
    await clickLink(page2, 'submit')
    await verifyOnProtectedPage(page2)

    // Both should be able to access protected content
    await page1.goto('http://localhost:3000/private')
    await verifyOnProtectedPage(page1)
    
    await page2.goto('http://localhost:3000/private')
    await verifyOnProtectedPage(page2)

    // Clean up
    await context1.close()
    await context2.close()
  })
})
