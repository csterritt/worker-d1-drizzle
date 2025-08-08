import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Sign-Up UX Flow', () => {
  test('successful sign-up redirects to proper page with success message', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    const uniqueEmail = `testuser${Date.now()}@example.com`
    
    // Fill out the sign-up form
    await fillInput(page, 'signup-name-input', 'Test User')
    await fillInput(page, 'signup-email-input', uniqueEmail)
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    // Submit the form
    await clickLink(page, 'signup-submit')
    
    // Wait for navigation/processing
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should redirect to sign-in page (not show JSON dump)
    expect(page.url()).toContain('/auth/sign-in')
    
    // Should show success message (not raw JSON)
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"id":')
    expect(pageContent).not.toContain('"email":')
    expect(pageContent).not.toContain('"createdAt":')
    
    // Should show a success message to user
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Account created successfully')
  })

  test('duplicate email shows error message instead of JSON', async ({ page }) => {
    const testEmail = `duplicate${Date.now()}@example.com`
    
    // Step 1: Create first user via UI (CSRF protection blocks API)
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'First User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'password123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Verify first user was created successfully
    expect(page.url()).toContain('/auth/sign-in')
    let bodyText = await page.textContent('body')
    expect(bodyText).toContain('Account created successfully')
    
    // Step 2: Try to register same email again via UI
    await fillInput(page, 'signup-name-input', 'Second User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'differentpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should stay on sign-in page
    expect(page.url()).toContain('/auth/sign-in')
    
    // Should not show JSON dump
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"error":')
    expect(pageContent).not.toContain('"message":')
    
    // Should show user-friendly error message
    bodyText = await page.textContent('body')
    expect(bodyText).toContain('already exists')
  })

  test('validation errors show proper page instead of JSON', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Submit form with missing fields
    await fillInput(page, 'signup-name-input', '')
    await fillInput(page, 'signup-email-input', 'invalid-email')
    await fillInput(page, 'signup-password-input', '123') // Too short
    
    await clickLink(page, 'signup-submit')
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

  test('sign-in page still works after sign-up flow', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Verify both forms are still present and functional
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('submit')).toBeVisible()
    
    await expect(page.getByTestId('signup-name-input')).toBeVisible()
    await expect(page.getByTestId('signup-email-input')).toBeVisible()
    await expect(page.getByTestId('signup-password-input')).toBeVisible()
    await expect(page.getByTestId('signup-submit')).toBeVisible()
    
    // Verify page title and basic structure
    await expect(page).toHaveTitle('Worker, D1, Drizzle')
    
    // Should not contain any JSON-like content
    const pageContent = await page.content()
    expect(pageContent).not.toContain('{"')
    expect(pageContent).not.toContain('"}')
  })

  test('network errors show proper error page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Intercept and fail the sign-up request
    await page.route('**/auth/sign-up', route => {
      route.abort('failed')
    })

    await fillInput(page, 'signup-name-input', 'Test User')
    await fillInput(page, 'signup-email-input', 'test@example.com')
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should handle gracefully - stay on sign-in page or show error page
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/(sign-in|error|auth)/)
    
    // Should not show raw JSON error
    const pageContent = await page.content()
    expect(pageContent).not.toContain('"stack":')
    expect(pageContent).not.toContain('"name":"Error"')
  })
})
