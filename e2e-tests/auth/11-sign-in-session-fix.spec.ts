import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Sign-In Session Fix', () => {
  test('successful sign-in shows only welcome message, no authentication error', async ({ page }) => {
    // Step 1: Create a user first via sign-up
    const testEmail = `sessiontest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account via sign-up form
    await fillInput(page, 'signup-name-input', 'Session Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'sessiontest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Verify account was created and redirected to sign-in
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('Account created successfully')
    expect(page.url()).toContain('/auth/sign-in')
    
    // Step 2: Sign in with the created account
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'sessiontest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 3: Verify the fix - should redirect to home page
    console.log('Final URL after sign-in:', page.url())
    expect(page.url()).toBe('http://localhost:3000/')
    
    // Step 4: Check the page content
    bodyText = await page.textContent('body')
    console.log('Page content length:', bodyText?.length)
    
    // Should show ONLY the welcome message
    expect(bodyText).toContain('Welcome')
    expect(bodyText).toMatch(/(Welcome|signed in)/i)
    
    // Should NOT show the "you must sign in" message
    expect(bodyText).not.toContain('you must sign in')
    expect(bodyText).not.toContain('must sign in')
    expect(bodyText).not.toContain('sign in to visit')
    expect(bodyText).not.toContain('authentication required')
    expect(bodyText).not.toContain('unauthorized')
    
    // Should show proper HTML page structure (not error page)
    const pageContent = await page.content()
    expect(pageContent).toContain('<!DOCTYPE html>')
    expect(pageContent).toContain('Worker, D1, Drizzle')
    
    // Step 5: Verify that the user is actually signed in by checking for sign-out link
    const signOutText = bodyText?.includes('Sign out') || bodyText?.includes('sign out')
    console.log('Page shows sign-out option:', signOutText)
    
    // Should show that user is signed in (sign-out option available)
    expect(bodyText).toMatch(/(sign out|logout)/i)
  })

  test('signed-in user can access protected page without additional messages', async ({ page }) => {
    // This test verifies that once signed in, the user can access protected pages
    
    // Step 1: Create and sign in a user
    const testEmail = `protectedtest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account
    await fillInput(page, 'signup-name-input', 'Protected Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'protectedtest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign in
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'protectedtest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should be on home page with welcome message
    expect(page.url()).toBe('http://localhost:3000/')
    
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('Welcome')
    expect(bodyText).not.toContain('you must sign in')
    
    // Step 2: Try to access the protected page
    await page.goto('http://localhost:3000/private')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should be able to access the protected page now
    console.log('Protected page URL:', page.url())
    console.log('Protected page accessible:', !page.url().includes('/auth/sign-in'))
    
    bodyText = await page.textContent('body')
    
    // Should NOT redirect back to sign-in page
    expect(page.url()).toBe('http://localhost:3000/private')
    
    // Should NOT show authentication error
    expect(bodyText).not.toContain('you must sign in')
    expect(bodyText).not.toContain('must sign in')
    expect(bodyText).not.toContain('authentication required')
    
    // Should show protected content
    expect(bodyText).toMatch(/(private|protected|authenticated)/i)
  })

  test('sign-in redirect destination is correct', async ({ page }) => {
    // This test verifies that sign-in redirects to home page, not protected page
    
    const testEmail = `redirecttest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account
    await fillInput(page, 'signup-name-input', 'Redirect Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'redirecttest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign in
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'redirecttest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should redirect to home page (PATHS.ROOT), not protected page (PATHS.PRIVATE)
    expect(page.url()).toBe('http://localhost:3000/')
    expect(page.url()).not.toContain('/private')
    
    const bodyText = await page.textContent('body')
    
    // Should show welcome message but no authentication error
    expect(bodyText).toContain('Welcome')
    expect(bodyText).not.toContain('you must sign in')
    
    console.log('✅ Sign-in correctly redirects to home page, avoiding session timing issue')
  })
})
