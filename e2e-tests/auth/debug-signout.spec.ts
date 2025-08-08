import { test, expect } from '@playwright/test'

test.describe('Debug Sign-Out UX', () => {
  test('verify sign-out handler works without full sign-in flow', async ({ page, request }) => {
    // Test the sign-out endpoint directly to verify it's working
    console.log('Testing sign-out endpoint directly...')
    
    const signOutResponse = await request.post('http://localhost:3000/auth/sign-out', {
      failOnStatusCode: false
    })
    
    console.log('Sign-out response status:', signOutResponse.status())
    console.log('Sign-out response headers:', signOutResponse.headers())
    
    // Should redirect (302/303) or return 200, not 403 or 500
    expect([200, 302, 303]).toContain(signOutResponse.status())
    
    // If it's a redirect, check the location
    if (signOutResponse.status() === 302 || signOutResponse.status() === 303) {
      const location = signOutResponse.headers()['location']
      console.log('Redirect location:', location)
      expect(location).toBe('/')
    }
    
    // Test directly via browser navigation to see what happens
    await page.goto('http://localhost:3000')
    
    // Navigate to sign-out handler directly
    await page.goto('http://localhost:3000/auth/sign-out', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    })
    
    console.log('Final URL after direct sign-out:', page.url())
    
    // Should redirect to home page
    expect(page.url()).toBe('http://localhost:3000/')
    
    // Should show success message
    const bodyText = await page.textContent('body')
    console.log('Body contains sign-out message:', bodyText?.includes('signed out'))
    expect(bodyText).toMatch(/(signed out|sign.*out)/i)
  })

  test('verify API vs custom handler behavior', async ({ request }) => {
    console.log('Testing better-auth API endpoint...')
    
    // Test the original better-auth API endpoint
    const apiResponse = await request.post('http://localhost:3000/api/auth/sign-out', {
      failOnStatusCode: false
    })
    
    console.log('API endpoint status:', apiResponse.status())
    const apiBody = await apiResponse.text()
    console.log('API endpoint response body:', apiBody)
    
    // Test our custom handler
    console.log('Testing custom sign-out handler...')
    
    const customResponse = await request.post('http://localhost:3000/auth/sign-out', {
      failOnStatusCode: false
    })
    
    console.log('Custom handler status:', customResponse.status())
    console.log('Custom handler headers:', customResponse.headers())
    
    // Custom handler should redirect, API might return JSON
    expect([200, 302, 303]).toContain(customResponse.status())
  })
})
