import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Welcome Username Display Test', () => {
  test('verify "Welcome, <username>!" message disappears after sign-out', async ({ page }) => {
    const testEmail = `welcometest${Date.now()}@example.com`
    const userName = 'John Doe'
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create user with specific name
    await fillInput(page, 'signup-name-input', userName)
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'welcometest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign in
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'welcometest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('=== CHECKING SIGNED-IN STATE ===')
    let bodyText = await page.textContent('body')
    
    // Should show user-specific welcome message
    const userWelcomePattern = `Welcome, ${userName}!`
    console.log(`Looking for: "${userWelcomePattern}"`)
    console.log(`Body contains this pattern: ${bodyText?.includes(userWelcomePattern)}`)
    
    // Should show the user-specific welcome message
    expect(bodyText).toContain(userWelcomePattern)
    
    console.log('✅ User-specific welcome message is showing when signed in')
    
    console.log('=== PERFORMING SIGN-OUT ===')
    
    // Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('=== CHECKING SIGNED-OUT STATE ===')
    bodyText = await page.textContent('body')
    
    // Should NOT show user-specific welcome message
    console.log(`Looking for: "${userWelcomePattern}" (should be gone)`)
    console.log(`Body contains this pattern: ${bodyText?.includes(userWelcomePattern)}`)
    
    // This is the main assertion - the user-specific welcome should be gone
    expect(bodyText).not.toContain(userWelcomePattern)
    
    // Should still show generic welcome (that's fine)
    console.log(`Body contains generic "Welcome!": ${bodyText?.includes('Welcome!')}`)
    
    console.log('✅ User-specific welcome message is properly cleared after sign-out')
  })

  test('test with email as username fallback', async ({ page }) => {
    const testEmail = `emailtest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create user without name (so email will be used as fallback)
    await fillInput(page, 'signup-name-input', '') // Empty name
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'emailtest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign in
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'emailtest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    let bodyText = await page.textContent('body')
    
    // Should show email as fallback in welcome message
    const emailWelcomePattern = `Welcome, ${testEmail}!`
    console.log(`Looking for email fallback: "${emailWelcomePattern}"`)
    console.log(`Body contains this pattern: ${bodyText?.includes(emailWelcomePattern)}`)
    
    if (bodyText?.includes(emailWelcomePattern)) {
      console.log('Email fallback is working')
      
      // Sign out
      await clickLink(page, 'sign-out-link')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      bodyText = await page.textContent('body')
      
      // Should NOT show email welcome after sign-out
      expect(bodyText).not.toContain(emailWelcomePattern)
      console.log('✅ Email welcome message properly cleared after sign-out')
    } else {
      console.log('Email fallback not showing (might be using "User" fallback)')
      
      // Check for "User" fallback
      const userFallbackPattern = 'Welcome, User!'
      if (bodyText?.includes(userFallbackPattern)) {
        console.log('Using "User" fallback')
        
        // Sign out and verify it's cleared
        await clickLink(page, 'sign-out-link')
        await page.waitForLoadState('networkidle', { timeout: 10000 })
        
        bodyText = await page.textContent('body')
        expect(bodyText).not.toContain(userFallbackPattern)
        console.log('✅ "User" fallback welcome message properly cleared after sign-out')
      }
    }
  })

  test('manual inspection of page content after sign-out', async ({ page }) => {
    const testEmail = `inspecttest${Date.now()}@example.com`
    const userName = 'Inspector User'
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create and sign in user
    await fillInput(page, 'signup-name-input', userName)
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'inspecttest123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'inspecttest123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('=== FULL PAGE CONTENT AFTER SIGN-OUT ===')
    const bodyText = await page.textContent('body')
    
    // Print all lines containing "Welcome"
    const lines = bodyText?.split('\n') || []
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('welcome')) {
        console.log(`Line ${index}: "${line.trim()}"`)
      }
    })
    
    // Check for any occurrence of the user's name
    const nameOccurrences = bodyText?.split(userName).length || 1
    console.log(`Occurrences of "${userName}" in body: ${nameOccurrences - 1}`)
    
    // This should be 0 after proper sign-out
    expect(nameOccurrences - 1).toBe(0)
    
    expect(true).toBe(true)
  })
})
