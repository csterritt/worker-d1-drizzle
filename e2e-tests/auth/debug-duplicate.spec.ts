import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Debug Duplicate Email Detection', () => {
  test('debug duplicate email behavior step by step', async ({ page, request }) => {
    const testEmail = `debug${Date.now()}@example.com`
    
    console.log('Testing with email:', testEmail)
    
    // Step 1: Create first user via API directly
    console.log('Step 1: Creating first user via API...')
    const firstUserResponse = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'First User',
        email: testEmail,
        password: 'password123'
      },
      failOnStatusCode: false
    })
    
    console.log('First user API response status:', firstUserResponse.status())
    const firstUserBody = await firstUserResponse.text()
    console.log('First user API response body:', firstUserBody)
    
    // Step 2: Try to create second user via API directly (to test API behavior)
    console.log('Step 2: Creating second user via API...')
    const secondUserResponse = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'Second User',
        email: testEmail,
        password: 'differentPassword123'
      },
      failOnStatusCode: false
    })
    
    console.log('Second user API response status:', secondUserResponse.status())
    const secondUserBody = await secondUserResponse.text()
    console.log('Second user API response body:', secondUserBody)
    
    // Step 3: Try to create third user via our custom handler
    console.log('Step 3: Creating third user via custom handler...')
    const thirdUserResponse = await request.post('http://localhost:3000/auth/sign-up', {
      form: {
        name: 'Third User',
        email: testEmail,
        password: 'anotherPassword123'
      },
      failOnStatusCode: false
    })
    
    console.log('Third user custom handler response status:', thirdUserResponse.status())
    const thirdUserHeaders = thirdUserResponse.headers()
    console.log('Third user custom handler response headers:', thirdUserHeaders)
    
    // Step 4: Test via UI
    console.log('Step 4: Testing via UI...')
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'Fourth User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'uiPassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    console.log('Final URL after UI submission:', page.url())
    const bodyText = await page.textContent('body')
    console.log('Page body contains "already exists":', bodyText?.includes('already exists'))
    console.log('Page body contains "Account created":', bodyText?.includes('Account created'))
    
    // The test should help us understand what's happening
    expect(true).toBe(true) // Always pass, we're just debugging
  })
})
