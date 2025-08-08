import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Sign-Out Session Clearing', () => {
  test('after sign-out, welcome message disappears and user is no longer authenticated', async ({ page }) => {
    // Step 1: Create and sign in a user
    const testEmail = `signouttest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account
    await fillInput(page, 'signup-name-input', 'Sign Out Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'signouttest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign in
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'signouttest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 2: Verify user is signed in
    expect(page.url()).toBe('http://localhost:3000/')
    
    let bodyText = await page.textContent('body')
    console.log('BEFORE sign-out - Body contains welcome:', bodyText?.includes('Welcome'))
    console.log('BEFORE sign-out - Body contains sign-out:', bodyText?.includes('Sign out'))
    
    // Should show welcome message and sign-out button
    expect(bodyText).toContain('Welcome')
    expect(bodyText).toContain('Sign Out Test User') // User's name should be visible
    expect(bodyText).toContain('Sign out')
    
    // Should NOT show "Sign in" link
    expect(bodyText).not.toContain('Sign in')
    
    // Step 3: Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 4: Verify user is signed out and session is cleared
    expect(page.url()).toBe('http://localhost:3000/')
    
    bodyText = await page.textContent('body')
    console.log('AFTER sign-out - Body contains welcome:', bodyText?.includes('Welcome'))
    console.log('AFTER sign-out - Body contains sign-out:', bodyText?.includes('Sign out'))
    console.log('AFTER sign-out - Body contains sign-in:', bodyText?.includes('Sign in'))
    
    // Should show sign-out success message
    expect(bodyText).toContain('signed out successfully')
    
    // Should NOT show welcome message with username (THIS IS THE BUG BEING FIXED)
    expect(bodyText).not.toContain('Welcome, Sign Out Test User')
    expect(bodyText).not.toContain('Sign Out Test User')
    expect(bodyText).not.toContain('Sign out') // No sign-out button
    
    // Should show "Sign in" link instead
    expect(bodyText).toContain('Sign in')
    
    console.log('✅ Session properly cleared after sign-out')
  })

  test('after sign-out, user cannot access protected pages', async ({ page }) => {
    // Step 1: Create and sign in a user
    const testEmail = `protectedtest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account and sign in
    await fillInput(page, 'signup-name-input', 'Protected Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'protectedtest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'protectedtest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 2: Verify user can access protected page while signed in
    await page.goto('http://localhost:3000/private')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    expect(page.url()).toBe('http://localhost:3000/private')
    let bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(private|protected)/i)
    
    // Step 3: Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 4: Try to access protected page after sign-out
    await page.goto('http://localhost:3000/private')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should be redirected to sign-in page (not able to access protected page)
    expect(page.url()).toContain('/auth/sign-in')
    
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('you must sign in')
    
    console.log('✅ Protected pages properly blocked after sign-out')
  })

  test('sign-out cookies are properly cleared', async ({ page }) => {
    // Step 1: Create and sign in a user
    const testEmail = `cookiestest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'Cookies Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'cookiestest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'cookiestest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 2: Check cookies after sign-in
    let cookies = await page.context().cookies()
    const sessionTokenCookie = cookies.find(c => c.name === 'better-auth.session_token')
    const sessionDataCookie = cookies.find(c => c.name === 'better-auth.session_data')
    
    console.log('BEFORE sign-out - Session token cookie:', sessionTokenCookie ? 'EXISTS' : 'MISSING')
    console.log('BEFORE sign-out - Session data cookie:', sessionDataCookie ? 'EXISTS' : 'MISSING')
    
    expect(sessionTokenCookie).toBeTruthy()
    expect(sessionDataCookie).toBeTruthy()
    
    // Step 3: Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 4: Check cookies after sign-out
    cookies = await page.context().cookies()
    const sessionTokenCookieAfter = cookies.find(c => c.name === 'better-auth.session_token')
    const sessionDataCookieAfter = cookies.find(c => c.name === 'better-auth.session_data')
    
    console.log('AFTER sign-out - Session token cookie:', sessionTokenCookieAfter ? 'EXISTS' : 'CLEARED')
    console.log('AFTER sign-out - Session data cookie:', sessionDataCookieAfter ? 'EXISTS' : 'CLEARED')
    
    // Cookies should be cleared (undefined) or have Max-Age=0
    if (sessionTokenCookieAfter) {
      console.log('Session token cookie value:', sessionTokenCookieAfter.value)
      console.log('Session token cookie expires:', sessionTokenCookieAfter.expires)
    }
    
    if (sessionDataCookieAfter) {
      console.log('Session data cookie value:', sessionDataCookieAfter.value)  
      console.log('Session data cookie expires:', sessionDataCookieAfter.expires)
    }
    
    // Either cookies are completely removed or they're expired/empty
    expect(!sessionTokenCookieAfter || sessionTokenCookieAfter.value === '' || sessionTokenCookieAfter.expires === -1).toBeTruthy()
    expect(!sessionDataCookieAfter || sessionDataCookieAfter.value === '' || sessionDataCookieAfter.expires === -1).toBeTruthy()
    
    console.log('✅ Session cookies properly cleared after sign-out')
  })
})
