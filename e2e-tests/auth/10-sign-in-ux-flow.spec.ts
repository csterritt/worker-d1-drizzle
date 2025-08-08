import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Sign-In UX Flow', () => {
  test('successful sign-in redirects to proper page instead of showing JSON', async ({ page }) => {
    // Step 1: Create a user first
    const testEmail = `signintest${Date.now()}@example.com`
    
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Create account via sign-up form
    await fillInput(page, 'signup-name-input', 'Test User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Verify account was created
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('Account created successfully')
    
    // Step 2: Now sign in with the created account
    await fillInput(page, 'email-input', testEmail)
    await fillInput(page, 'password-input', 'validpassword123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should redirect to protected page (not show JSON dump)
    expect(page.url()).not.toContain('/api/')
    expect(page.url()).toMatch(/(private|\/)/i)
    
    // Should not show JSON dump
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"user":')
    expect(pageContent).not.toContain('"session":')
    expect(pageContent).not.toContain('"token":')
    expect(pageContent).not.toContain('{"')
    
    // Should show proper HTML page structure
    expect(pageContent).toContain('<!DOCTYPE html>')
    expect(pageContent).toContain('Worker, D1, Drizzle')
    
    // Should show welcome message or protected content
    bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(welcome|signed in|private)/i)
    
    // Verify page title is correct (not JSON error)
    await expect(page).toHaveTitle('Worker, D1, Drizzle')
  })

  test('invalid credentials show error message instead of JSON', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Try to sign in with invalid credentials
    await fillInput(page, 'email-input', 'nonexistent@example.com')
    await fillInput(page, 'password-input', 'wrongpassword123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should stay on sign-in page
    expect(page.url()).toContain('/auth/sign-in')
    
    // Should not show JSON dump
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"error":')
    expect(pageContent).not.toContain('"message":')
    expect(pageContent).not.toContain('{"')
    
    // Should show user-friendly error message
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(invalid|credentials|password|email|not found)/i)
  })

  test('validation errors show proper page instead of JSON', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Submit form with missing fields
    await fillInput(page, 'email-input', '')
    await fillInput(page, 'password-input', '')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should stay on sign-in page
    expect(page.url()).toContain('/auth/sign-in')
    
    // Should not show JSON dump
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"validation":')
    expect(pageContent).not.toContain('"field":')
    
    // Should show user-friendly error
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(required|email|password)/i)
  })

  test('compare old vs new sign-in behavior', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    console.log('Testing OLD behavior (direct API call)...')
    
    // Test what the OLD behavior would have been (direct API call)
    const apiResponse = await page.request.post('http://localhost:3000/api/auth/sign-in/email', {
      form: {
        email: 'test@example.com',
        password: 'testpassword123'
      },
      failOnStatusCode: false
    })
    
    console.log('OLD API behavior status:', apiResponse.status())
    const apiBody = await apiResponse.text()
    console.log('OLD API behavior body type:', typeof apiBody)
    
    // The old behavior might return JSON or be blocked by CSRF
    expect([400, 401, 403, 404]).toContain(apiResponse.status())
    
    console.log('Testing NEW behavior (custom handler via form)...')
    
    // Test the NEW behavior (our custom handler via form submission)
    await page.goto('http://localhost:3000/auth/sign-in')
    
    const newForm = `
      <form method="post" action="/auth/sign-in">
        <input name="email" value="test@example.com" />
        <input name="password" value="wrongpassword" />
        <button type="submit" id="new-sign-in">New Sign In</button>
      </form>
    `
    
    await page.evaluate((formHtml) => {
      document.body.insertAdjacentHTML('beforeend', formHtml)
    }, newForm)
    
    await page.click('#new-sign-in')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // NEW behavior should redirect to sign-in page with error message
    expect(page.url()).toContain('/auth/sign-in')
    
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/(invalid|credentials|error)/i)
    
    console.log('NEW behavior: Redirected with user-friendly error message ✅')
  })

  test('sign-in form action was updated correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Check if there are any forms with the old action
    const oldActionForms = await page.locator('form[action="/api/auth/sign-in/email"]').count()
    console.log('Forms with old action (/api/auth/sign-in/email):', oldActionForms)
    
    // Should be 0 - we updated the form to use the new action
    expect(oldActionForms).toBe(0)
    
    // Check if there are forms with the new action
    const newActionForms = await page.locator('form[action="/auth/sign-in"]').count()
    console.log('Forms with new action (/auth/sign-in):', newActionForms)
    
    // Should be at least 1 - the sign-in form
    expect(newActionForms).toBeGreaterThanOrEqual(1)
    
    console.log('✅ Sign-in form action successfully updated to use custom handler')
  })

  test('network errors handled gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Intercept and fail the better-auth API request
    await page.route('**/api/auth/sign-in/email', route => {
      route.abort('failed')
    })

    await fillInput(page, 'email-input', 'test@example.com')
    await fillInput(page, 'password-input', 'validpassword123')
    
    await clickLink(page, 'submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should handle gracefully - stay on sign-in page or show error page
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/(sign-in|error|auth)/i)
    
    // Should not show raw network error
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"stack":')
    expect(pageContent).not.toContain('failed')
    expect(pageContent).not.toContain('abort')
  })
})
