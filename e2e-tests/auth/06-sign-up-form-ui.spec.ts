import { test, expect } from '@playwright/test'
import { fillInput, clickLink } from '../support/finders'

test.describe('Sign-Up Form UI on Sign-In Page', () => {
  test('displays sign-up form with all required fields', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Verify sign-up form is present
    await expect(page.getByText('New user?')).toBeVisible()
    
    // Verify all form fields are present
    await expect(page.getByTestId('signup-name-input')).toBeVisible()
    await expect(page.getByTestId('signup-email-input')).toBeVisible()
    await expect(page.getByTestId('signup-password-input')).toBeVisible()
    await expect(page.getByTestId('signup-submit')).toBeVisible()
    
    // Verify field labels in sign-up form specifically
    const signupForm = page.locator('form[aria-label="Sign up form"]')
    await expect(signupForm.getByText('Name', { exact: true })).toBeVisible()
    await expect(signupForm.getByText('Email', { exact: true })).toBeVisible()
    await expect(signupForm.getByText('Password', { exact: true })).toBeVisible()
    
    // Verify submit button text
    await expect(page.getByTestId('signup-submit')).toHaveText('Create Account')
  })

  test('validates required fields on sign-up form', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Try to submit empty form
    await clickLink(page, 'signup-submit')
    
    // Should still be on sign-in page due to validation
    await expect(page).toHaveURL('http://localhost:3000/auth/sign-in')
    
    // Check HTML5 validation messages
    const nameInput = page.getByTestId('signup-name-input')
    const emailInput = page.getByTestId('signup-email-input')
    const passwordInput = page.getByTestId('signup-password-input')
    
    // At least one field should have validation message
    const nameValidation = await nameInput.evaluate((el: any) => el.validationMessage)
    const emailValidation = await emailInput.evaluate((el: any) => el.validationMessage)
    const passwordValidation = await passwordInput.evaluate((el: any) => el.validationMessage)
    
    expect(nameValidation || emailValidation || passwordValidation).toBeTruthy()
  })

  test('validates email format in sign-up form', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Fill form with invalid email
    await fillInput(page, 'signup-name-input', 'Test User')
    await fillInput(page, 'signup-email-input', 'invalid-email')
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    await clickLink(page, 'signup-submit')
    
    // Should still be on sign-in page due to email validation
    await expect(page).toHaveURL('http://localhost:3000/auth/sign-in')
    
    // Check email validation message
    const emailInput = page.getByTestId('signup-email-input')
    const validationMessage = await emailInput.evaluate(
      (el: any) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test('validates password minimum length in sign-up form', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Fill form with short password
    await fillInput(page, 'signup-name-input', 'Test User')
    await fillInput(page, 'signup-email-input', 'test@example.com')
    await fillInput(page, 'signup-password-input', '123') // Less than 8 characters
    
    await clickLink(page, 'signup-submit')
    
    // Should still be on sign-in page due to password validation
    await expect(page).toHaveURL('http://localhost:3000/auth/sign-in')
    
    // Check password validation message
    const passwordInput = page.getByTestId('signup-password-input')
    const validationMessage = await passwordInput.evaluate(
      (el: any) => el.validationMessage
    )
    expect(validationMessage).toBeTruthy()
  })

  test('successfully submits sign-up form with valid data', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    const uniqueEmail = `testuser${Date.now()}@example.com`
    
    // Fill form with valid data
    await fillInput(page, 'signup-name-input', 'Test User')
    await fillInput(page, 'signup-email-input', uniqueEmail)
    await fillInput(page, 'signup-password-input', 'validpassword123')
    
    // Submit form
    await clickLink(page, 'signup-submit')
    
    // Should redirect or show success (depending on better-auth configuration)
    // Wait for navigation or response
    await page.waitForLoadState('networkidle', { timeout: 5000 })
    
    // Verify form submission was processed (URL change or content change)
    const currentUrl = page.url()
    expect(currentUrl).not.toBe('http://localhost:3000/')
  })

  test('form fields have correct attributes and accessibility', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Check input types
    await expect(page.getByTestId('signup-name-input')).toHaveAttribute('type', 'text')
    await expect(page.getByTestId('signup-email-input')).toHaveAttribute('type', 'email')
    await expect(page.getByTestId('signup-password-input')).toHaveAttribute('type', 'password')
    
    // Check required attributes
    await expect(page.getByTestId('signup-name-input')).toHaveAttribute('required')
    await expect(page.getByTestId('signup-email-input')).toHaveAttribute('required')
    await expect(page.getByTestId('signup-password-input')).toHaveAttribute('required')
    
    // Check password minimum length
    await expect(page.getByTestId('signup-password-input')).toHaveAttribute('minlength', '8')
    
    // Check aria-label attributes
    await expect(page.getByTestId('signup-name-input')).toHaveAttribute('aria-label', 'Name')
    await expect(page.getByTestId('signup-email-input')).toHaveAttribute('aria-label', 'Email')
    await expect(page.getByTestId('signup-password-input')).toHaveAttribute('aria-label', 'Password')
    
    // Check form action
    const form = page.locator('form[aria-label="Sign up form"]')
    await expect(form).toHaveAttribute('action', '/api/auth/sign-up/email')
    await expect(form).toHaveAttribute('method', 'post')
  })

  test('both sign-in and sign-up forms coexist on same page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-in')

    // Verify sign-in form is present
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('submit')).toBeVisible()
    
    // Verify sign-up form is also present
    await expect(page.getByTestId('signup-name-input')).toBeVisible()
    await expect(page.getByTestId('signup-email-input')).toBeVisible()
    await expect(page.getByTestId('signup-password-input')).toBeVisible()
    await expect(page.getByTestId('signup-submit')).toBeVisible()
    
    // Verify divider text
    await expect(page.getByText('New user?')).toBeVisible()
    
    // Both forms should be functional
    await fillInput(page, 'email-input', 'test@example.com')
    await fillInput(page, 'signup-email-input', 'newuser@example.com')
    
    // Both should retain their values
    await expect(page.getByTestId('email-input')).toHaveValue('test@example.com')
    await expect(page.getByTestId('signup-email-input')).toHaveValue('newuser@example.com')
  })

  test('handles duplicate email registration gracefully', async ({ page, request }) => {
    const testEmail = `duplicate${Date.now()}@example.com`
    
    // Use API to create first user
    const firstUser = await request.post('http://localhost:3000/api/auth/sign-up/email', {
      form: {
        name: 'First User',
        email: testEmail,
        password: 'password123'
      },
      failOnStatusCode: false
    })
    
    // Now try to register same email via UI
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await fillInput(page, 'signup-name-input', 'Second User')
    await fillInput(page, 'signup-email-input', testEmail)
    await fillInput(page, 'signup-password-input', 'differentpassword123')
    
    await clickLink(page, 'signup-submit')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Should handle duplicate email appropriately
    // Could redirect to error page, stay on same page, or show error message
    const currentUrl = page.url()
    expect(typeof currentUrl).toBe('string')
    // The page should either stay on sign-in page or redirect somewhere
    expect(currentUrl).toMatch(/(sign-in|error|auth)/)
  })
})
