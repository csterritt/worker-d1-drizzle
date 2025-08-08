import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Debug User Context After Sign-Out', () => {
  test('investigate what happens to user context after sign-out', async ({ page }) => {
    const testEmail = `debuguser${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create and sign in user
    await fillInput(page, 'signup-name-input', 'Debug User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'debuguser123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'debuguser123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('=== AFTER SIGN-IN ===')
    console.log('URL:', page.url())
    
    let bodyText = await page.textContent('body')
    console.log('Contains "Welcome":', bodyText?.includes('Welcome'))
    console.log('Contains "Debug User":', bodyText?.includes('Debug User'))
    console.log('Contains "Sign out":', bodyText?.includes('Sign out'))
    console.log('Contains "Sign in":', bodyText?.includes('Sign in'))
    
    let cookies = await page.context().cookies()
    console.log('Session cookies:', cookies.filter(c => c.name.includes('better-auth')).map(c => c.name))
    
    console.log('=== PERFORMING SIGN-OUT ===')
    
    // Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('=== IMMEDIATELY AFTER SIGN-OUT ===')
    console.log('URL:', page.url())
    
    bodyText = await page.textContent('body')
    console.log('Contains "Welcome":', bodyText?.includes('Welcome'))
    console.log('Contains "Debug User":', bodyText?.includes('Debug User'))
    console.log('Contains "Sign out":', bodyText?.includes('Sign out'))
    console.log('Contains "Sign in":', bodyText?.includes('Sign in'))
    console.log('Contains "signed out successfully":', bodyText?.includes('signed out successfully'))
    
    cookies = await page.context().cookies()
    console.log('Session cookies after sign-out:', cookies.filter(c => c.name.includes('better-auth')).map(c => c.name))
    
    console.log('=== REFRESHING PAGE TO SEE IF CONTEXT UPDATES ===')
    
    // Refresh page to see if user context gets properly cleared
    await page.reload()
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    bodyText = await page.textContent('body')
    console.log('After reload - Contains "Welcome":', bodyText?.includes('Welcome'))
    console.log('After reload - Contains "Debug User":', bodyText?.includes('Debug User'))
    console.log('After reload - Contains "Sign out":', bodyText?.includes('Sign out'))
    console.log('After reload - Contains "Sign in":', bodyText?.includes('Sign in'))
    
    console.log('=== TESTING MIDDLEWARE BY ACCESSING DIFFERENT PAGES ===')
    
    // Test middleware on different page
    await page.goto('http://localhost:3000/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    bodyText = await page.textContent('body')
    console.log('Fresh home page - Contains "Welcome":', bodyText?.includes('Welcome'))
    console.log('Fresh home page - Contains "Debug User":', bodyText?.includes('Debug User'))
    console.log('Fresh home page - Contains "Sign out":', bodyText?.includes('Sign out'))
    console.log('Fresh home page - Contains "Sign in":', bodyText?.includes('Sign in'))
    
    // Test protected page access
    await page.goto('http://localhost:3000/private')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('Protected page URL after sign-out:', page.url())
    
    if (page.url().includes('/auth/sign-in')) {
      console.log('✅ Middleware correctly blocks access to protected page')
    } else {
      console.log('❌ Middleware incorrectly allows access to protected page')
    }
    
    // This is just a debug test
    expect(true).toBe(true)
  })

  test('compare direct API sign-out vs custom handler sign-out', async ({ page }) => {
    const testEmail = `comparetest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create user
    await fillInput(page, 'signup-name-input', 'Compare Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'comparetest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign in
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'comparetest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('=== TESTING DIRECT API SIGN-OUT ===')
    
    // Try direct API call to sign-out
    const apiResponse = await page.request.post('http://localhost:3000/api/auth/sign-out', {
      failOnStatusCode: false
    })
    
    console.log('Direct API sign-out status:', apiResponse.status())
    
    // Check if user context changed
    await page.reload()
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    let bodyText = await page.textContent('body')
    console.log('After direct API - Contains "Welcome":', bodyText?.includes('Welcome'))
    console.log('After direct API - Contains "Compare Test User":', bodyText?.includes('Compare Test User'))
    console.log('After direct API - Contains "Sign in":', bodyText?.includes('Sign in'))
    
    expect(true).toBe(true)
  })
})
