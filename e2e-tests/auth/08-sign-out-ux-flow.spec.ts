import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Sign-Out UX Flow', () => {
  test('sign-out redirects to proper page with success message instead of JSON', async ({ page }) => {
    // Step 1: Sign up a user
    const testEmail = `signouttest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Step 2: Sign in the user
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should be redirected to protected area or home page
    // Verify user is signed in
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(Welcome|Test User|signed in|private)/i)
    
    // Step 3: Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should redirect to home page (not show JSON dump)
    expect(page.url()).toContain('/')
    expect(page.url()).not.toContain('/api/')
    
    // Should not show JSON dump
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"success":')
    expect(pageContent).not.toContain('"user":')
    expect(pageContent).not.toContain('"session":')
    
    // Should show success message to user
    const finalBodyText = await page.textContent('body')
    expect(finalBodyText).toMatch(/(signed out|sign out)/i)
    
    // Should show sign-in link again (user is no longer authenticated)
    await expect(page.getByTestId('sign-in-link')).toBeVisible()
  })

  test('sign-out from different pages redirects properly', async ({ page }) => {
    // Create and sign in user
    const testEmail = `signouttest2${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'Test User 2')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Navigate to private page first
    await page.goto('http://localhost:3000/private')
    await page.waitForLoadState('networkidle', { timeout: 5000 })
    
    // Sign out from private page
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should redirect to home page with success message
    expect(page.url()).toBe('http://localhost:3000/')
    
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(signed out|sign out)/i)
  })

  test('sign-out handles network errors gracefully', async ({ page }) => {
    // Create and sign in user
    const testEmail = `signouttest3${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'Test User 3')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Intercept and fail the sign-out request to better-auth API
    await page.route('**/api/auth/sign-out', route => {
      route.abort('failed')
    })
    
    // Sign out should still work gracefully
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should handle gracefully - redirect to home page
    expect(page.url()).toBe('http://localhost:3000/')
    
    // Should not show raw error or JSON
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"error":')
    expect(pageContent).not.toContain('failed')
    expect(pageContent).not.toContain('abort')
    
    // Should show completion message
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(sign.*out|completed)/i)
  })

  test('multiple sign-outs handled properly', async ({ page }) => {
    // This tests the edge case where user tries to sign out when already signed out
    
    await page.goto('http://localhost:3000')
    
    // Try to sign out when not signed in (should handle gracefully)
    const signOutResponse = await page.request.post('http://localhost:3000/auth/sign-out', {
      failOnStatusCode: false
    })
    
    // Should not crash or show error page
    expect([200, 302, 303]).toContain(signOutResponse.status())
    
    // Go to home page and verify it's working normally
    await page.goto('http://localhost:3000')
    await expect(page.getByTestId('sign-in-link')).toBeVisible()
  })

  test('sign-out preserves UI structure', async ({ page }) => {
    // Verify that after sign-out, the page structure is proper (not broken)
    
    // Create and sign in user
    const testEmail = `signouttest4${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'Test User 4')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Sign out
    await clickLink(page, 'sign-out-link')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Verify page structure is intact
    await expect(page).toHaveTitle('Worker, D1, Drizzle')
    
    // Should have proper navigation
    await expect(page.getByTestId('sign-in-link')).toBeVisible()
    
    // Should have main content area
    const mainContent = page.locator('.container')
    await expect(mainContent).toBeVisible()
    
    // Should have footer
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    
    // Should not have any broken/invalid HTML
    const pageContent = await page.content()
    expect(pageContent).toContain('<!DOCTYPE html>')
    expect(pageContent).toContain('</html>')
  })
})
