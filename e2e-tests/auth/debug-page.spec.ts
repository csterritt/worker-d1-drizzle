import { test, expect } from '@playwright/test'

test.describe('Page Debug Test', () => {
  test('check what is actually on the page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'debug-page.png', fullPage: true })
    
    // Get page content
    const content = await page.content()
    console.log('Page HTML content length:', content.length)
    
    // Check if page loaded successfully
    const title = await page.title()
    console.log('Page title:', title)
    
    // Check for any JavaScript errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Wait a bit for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Log any errors found
    console.log('JavaScript errors:', errors)
    
    // Check if basic structure exists
    const bodyText = await page.textContent('body')
    console.log('Body text includes "Sign In":', bodyText?.includes('Sign In'))
    console.log('Body text includes "New user":', bodyText?.includes('New user'))
    
    // Look for any forms on the page
    const forms = await page.locator('form').count()
    console.log('Number of forms found:', forms)
    
    // Look for inputs
    const inputs = await page.locator('input').count()
    console.log('Number of inputs found:', inputs)
    
    // Check specific elements we expect
    const emailInput = await page.locator('[data-testid="email-input"]').count()
    const signupNameInput = await page.locator('[data-testid="signup-name-input"]').count()
    
    console.log('Email input count:', emailInput)
    console.log('Signup name input count:', signupNameInput)
    
    // Test will pass if we get here - we're just debugging
    expect(true).toBe(true)
  })
})
