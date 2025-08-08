import { test, expect } from '@playwright/test'
import { startSignIn } from '../support/auth-helpers'
import { verifyOnProtectedPage, verifyOnSignInPage, verifyOnStartupPage } from '../support/page-verifiers'
import { fillInput, clickLink, verifyAlert } from '../support/finders'

test.describe('Better-Auth Middleware Protection', () => {
  test('unauthenticated user redirected from protected routes', async ({ page }) => {
    // Try to access protected page without authentication
    await page.goto('http://localhost:3000/private')

    // Should be redirected to sign-in page
    await verifyOnSignInPage(page)
    
    // Should show appropriate message
    await verifyAlert(page, 'You must sign in to visit that page')
  })

  test('authenticated user can access protected routes', async ({ page, request }) => {
    // Create a test user
    const timestamp = Date.now()
    const testEmail = `middleware.auth.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Middleware Test User',
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

    // Should be able to access other protected routes
    await page.goto('http://localhost:3000/private')
    await verifyOnProtectedPage(page)
  })

  test('already signed in user redirected from sign-in page', async ({ page, request }) => {
    // Create a test user
    const timestamp = Date.now()
    const testEmail = `middleware.redirect.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Redirect Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Sign in first
    await page.goto('http://localhost:3000')
    await startSignIn(page)
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')
    await verifyOnProtectedPage(page)

    // Now try to visit sign-in page while already signed in
    await page.goto('http://localhost:3000/auth/sign-in')

    // Should be redirected to private page or home with a message
    const currentUrl = page.url()
    expect(currentUrl).not.toContain('/auth/sign-in')
  })

  test('middleware properly handles malformed session cookies', async ({ page }) => {
    // Set malformed session cookie
    await page.context().addCookies([{
      name: 'better-auth.session_token',
      value: 'malformed-cookie-value!@#$%',
      domain: 'localhost',
      path: '/'
    }])

    // Try to access protected page
    await page.goto('http://localhost:3000/private')

    // Should gracefully handle malformed cookie and redirect to sign-in
    await verifyOnSignInPage(page)
  })

  test('middleware handles expired session gracefully', async ({ page }) => {
    // Set an expired session cookie (this would normally be handled by better-auth)
    await page.context().addCookies([{
      name: 'better-auth.session_token',
      value: 'expired-session-token',
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    }])

    // Try to access protected page
    await page.goto('http://localhost:3000/private')

    // Should redirect to sign-in page
    await verifyOnSignInPage(page)
  })

  test('middleware allows public routes for unauthenticated users', async ({ page }) => {
    // Access public routes without authentication
    await page.goto('http://localhost:3000')
    await verifyOnStartupPage(page)

    // Sign-in page should also be accessible
    await page.goto('http://localhost:3000/auth/sign-in')
    await verifyOnSignInPage(page)
  })

  test('middleware preserves intended destination after sign-in', async ({ page, request }) => {
    // Create a test user
    const timestamp = Date.now()
    const testEmail = `middleware.destination.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Destination Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Try to access protected page directly (should redirect to sign-in)
    await page.goto('http://localhost:3000/private')
    await verifyOnSignInPage(page)

    // Sign in
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    await clickLink(page, 'submit')

    // Should be redirected to originally intended destination (private page)
    await verifyOnProtectedPage(page)
  })

  test('middleware properly clears context on sign-out', async ({ page, request }) => {
    // Create a test user
    const timestamp = Date.now()
    const testEmail = `middleware.signout.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Sign Out Context Test User',
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

    // Sign out via API call
    await request.post('http://localhost:3000/api/auth/sign-out')

    // Try to access protected page - should be redirected
    await page.goto('http://localhost:3000/private')
    await verifyOnSignInPage(page)
  })

  test('middleware handles concurrent sign-out properly', async ({ browser, request }) => {
    // Create a test user
    const timestamp = Date.now()
    const testEmail = `middleware.concurrent.${timestamp}@example.com`
    
    await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Concurrent Sign Out Test User',
        email: testEmail,
        password: 'validpassword123'
      }
    })

    // Create two browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Sign in from both contexts
    for (const page of [page1, page2]) {
      await page.goto('http://localhost:3000')
      await startSignIn(page)
      await fillInput(page, 'email-input', testEmail)
      await fillInput(page, 'password-input', 'validpassword123')
      await clickLink(page, 'submit')
      await verifyOnProtectedPage(page)
    }

    // Sign out from one context
    const request1 = await context1.request.newContext()
    await request1.post('http://localhost:3000/api/auth/sign-out')

    // Both contexts should now require re-authentication
    // (This depends on better-auth session management configuration)
    await page1.goto('http://localhost:3000/private')
    await page2.goto('http://localhost:3000/private')
    
    // At least page1 should be signed out
    await verifyOnSignInPage(page1)

    // Clean up
    await context1.close()
    await context2.close()
  })
})
