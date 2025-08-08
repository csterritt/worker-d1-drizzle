import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Better-Auth Cookie Debug', () => {
  test('investigate better-auth cookie format and session establishment', async ({ page }) => {
    // Create a user first
    const testEmail = `cookietest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account
    await fillInput(page, 'signup-name-input', 'Cookie Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'cookietest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Now try signing in and capture all network activity
    console.log('=== TESTING DIRECT BETTER-AUTH API ===')
    
    // Intercept the better-auth API call to see cookies
    const requests: any[] = []
    const responses: any[] = []
    
    page.on('request', request => {
      if (request.url().includes('/api/auth/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        })
      }
    })
    
    page.on('response', response => {
      if (response.url().includes('/api/auth/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        })
      }
    })
    
    // Change form action to post directly to better-auth API
    await page.evaluate(() => {
      const form = document.querySelector('form[action="/auth/sign-in"]') as HTMLFormElement
      if (form) {
        form.action = '/api/auth/sign-in/email'
        console.log('Changed form action to:', form.action)
      }
    })
    
    // Fill and submit form
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'cookietest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('Current URL after direct API call:', page.url())
    
    // Log all captured requests and responses
    console.log('=== CAPTURED REQUESTS ===')
    requests.forEach((req, i) => {
      console.log(`Request ${i}:`, JSON.stringify(req, null, 2))
    })
    
    console.log('=== CAPTURED RESPONSES ===')
    responses.forEach((res, i) => {
      console.log(`Response ${i}:`, JSON.stringify(res, null, 2))
    })
    
    // Check current cookies
    const cookies = await page.context().cookies()
    console.log('=== CURRENT COOKIES ===')
    cookies.forEach(cookie => {
      console.log(`Cookie: ${cookie.name} = ${cookie.value}`)
      console.log(`  Domain: ${cookie.domain}, Path: ${cookie.path}`)
      console.log(`  HttpOnly: ${cookie.httpOnly}, Secure: ${cookie.secure}`)
    })
    
    // Check if user is now authenticated by trying to access protected page
    await page.goto('http://localhost:3000/private')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('Protected page URL:', page.url())
    const bodyText = await page.textContent('body')
    
    if (page.url().includes('/private')) {
      console.log('✅ USER IS AUTHENTICATED - Direct API works!')
    } else {
      console.log('❌ USER NOT AUTHENTICATED - Session not established')
    }
    
    // This test is just for debugging - we don't assert anything
    expect(true).toBe(true)
  })

  test('compare custom handler vs direct API cookie establishment', async ({ page }) => {
    const testEmail = `comparetest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account
    await fillInput(page, 'signup-name-input', 'Compare Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'comparetest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('=== TESTING CUSTOM HANDLER ===')
    
    // Test our custom handler first
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'comparetest123')
    
    // Capture cookies before sign-in
    let cookies = await page.context().cookies()
    console.log('Cookies BEFORE custom handler:', cookies.map(c => `${c.name}=${c.value}`))
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('URL after custom handler:', page.url())
    
    // Capture cookies after sign-in
    cookies = await page.context().cookies()
    console.log('Cookies AFTER custom handler:', cookies.map(c => `${c.name}=${c.value}`))
    
    // Check authentication
    await page.goto('http://localhost:3000/private')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    if (page.url().includes('/private')) {
      console.log('✅ Custom handler: USER IS AUTHENTICATED')
    } else {
      console.log('❌ Custom handler: USER NOT AUTHENTICATED')
    }
    
    expect(true).toBe(true)
  })
})
