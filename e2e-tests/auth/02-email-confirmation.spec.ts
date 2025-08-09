/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { test, expect } from '@playwright/test'
import { testWithDatabase, testWithDatabaseAndEmail } from '../support/db-helpers'

/**
 * E2E tests for email confirmation flow
 * Tests the complete email verification process from sign-up to confirmed sign-in
 */
test.describe('Better-Auth Email Confirmation', () => {
  
  testWithDatabaseAndEmail('sign-up sends confirmation email and user can verify', async ({ page, mailServer }: { page: any; mailServer: any }) => {
    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Fill in sign-up form (new user)
    const testEmail = 'newuser@example.com'
    const testPassword = 'password123'
    const testName = 'Test User'
    
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="name"]', testName)
    
    // Capture the email using smtp-tester
    const emailPromise = mailServer.captureOne(testEmail, { wait: 5000 })
    
    // Submit sign-up form
    await page.click('button[data-testid="sign-up-submit"]')
    
    // Should be redirected to email-sent page
    await expect(page).toHaveURL(/\/auth\/email-sent/)
    await expect(page.locator('[data-testid="email-sent-page"]')).toBeVisible()
    await expect(page.locator('text=Check Your Email')).toBeVisible()
    await expect(page.locator(`text=${testEmail}`)).toBeVisible()
    
    // Wait for and verify the confirmation email was sent
    const { email } = await emailPromise
    expect(email).toBeDefined()
    expect(email.subject).toContain('Confirm Your Email')
    expect(email.html).toContain(testName)
    expect(email.html).toContain('confirm')
    
    // Extract confirmation link from email
    const confirmLinkMatch = email.html.match(/href="([^"]*\/auth\/verify-email[^"]*)"/)
    expect(confirmLinkMatch).toBeTruthy()
    const confirmationUrl = confirmLinkMatch![1]
    
    // Visit the confirmation link
    await page.goto(confirmationUrl)
    
    // Should see email confirmation success page
    await expect(page.locator('[data-testid="email-confirmation-page"]')).toBeVisible()
    await expect(page.locator('text=Email Confirmed!')).toBeVisible()
    await expect(page.locator('[data-testid="sign-in-after-confirmation"]')).toBeVisible()
    
    // Click sign in button
    await page.click('[data-testid="sign-in-after-confirmation"]')
    
    // Should be redirected to sign-in page
    await expect(page).toHaveURL('/auth/sign-in')
    
    // Now sign in with the verified account
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[data-testid="sign-in-submit"]')
    
    // Should successfully sign in and redirect to private page
    await expect(page).toHaveURL('/private')
    await expect(page.locator('[data-testid="private-page-banner"]')).toBeVisible()
  })

  test('invalid confirmation token shows error', testWithDatabase(async ({ page }: { page: any }) => {
    // Visit confirmation endpoint with invalid token
    await page.goto('http://localhost:3000/auth/verify-email?token=invalid-token-123')
    
    // Should see error page
    await expect(page.locator('[data-testid="email-confirmation-page"]')).toBeVisible()
    await expect(page.locator('text=Confirmation Failed')).toBeVisible()
    await expect(page.locator('text=invalid or has expired')).toBeVisible()
    await expect(page.locator('[data-testid="back-to-sign-in"]')).toBeVisible()
    
    // Click back to sign in
    await page.click('[data-testid="back-to-sign-in"]')
    await expect(page).toHaveURL('/auth/sign-in')
  }))

  test('missing confirmation token shows error', testWithDatabase(async ({ page }: { page: any }) => {
    // Visit confirmation endpoint without token
    await page.goto('http://localhost:3000/auth/verify-email')
    
    // Should see error page
    await expect(page.locator('[data-testid="email-confirmation-page"]')).toBeVisible()
    await expect(page.locator('text=Confirmation Failed')).toBeVisible()
    await expect(page.locator('text=No verification token provided')).toBeVisible()
    await expect(page.locator('[data-testid="back-to-sign-in"]')).toBeVisible()
  }))

  test('unverified user cannot sign in', testWithDatabase(async ({ page }: { page: any }) => {
    // Try to sign in with an unverified account from seed data
    await page.goto('http://localhost:3000/auth/sign-in')
    
    // Use a test account that hasn't been verified (will be created unverified)
    await page.fill('input[name="email"]', 'unverified@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="name"]', 'Unverified User')
    
    // Submit sign-up first to create unverified account
    await page.click('button[data-testid="sign-up-submit"]')
    
    // Should be redirected to email-sent page
    await expect(page).toHaveURL(/\/auth\/email-sent/)
    
    // Go back to sign-in and try to sign in without verifying
    await page.goto('http://localhost:3000/auth/sign-in')
    await page.fill('input[name="email"]', 'unverified@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[data-testid="sign-in-submit"]')
    
    // Should show error message for unverified account
    await expect(page.locator('.alert-error')).toBeVisible()
    await expect(page.locator('text=verify')).toBeVisible()
  }))

  test('email-sent page without email parameter redirects', testWithDatabase(async ({ page }: { page: any }) => {
    // Visit email-sent page without email parameter
    await page.goto('http://localhost:3000/auth/email-sent')
    
    // Should be redirected to sign-in with message
    await expect(page).toHaveURL('/auth/sign-in')
    await expect(page.locator('.alert')).toBeVisible()
  }))

  testWithDatabaseAndEmail('duplicate email shows appropriate error during sign-up', async ({ page, mailServer }: { page: any; mailServer: any }) => {
    // First sign-up
    const testEmail = 'duplicate@example.com'
    await page.goto('http://localhost:3000/auth/sign-in')
    
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="name"]', 'First User')
    
    // Capture email for first sign-up
    const emailPromise1 = mailServer.captureOne(testEmail, { wait: 5000 })
    await page.click('button[data-testid="sign-up-submit"]')
    
    // Wait for email and verify first sign-up succeeded
    await emailPromise1
    await expect(page).toHaveURL(/\/auth\/email-sent/)
    
    // Try to sign up again with same email
    await page.goto('http://localhost:3000/auth/sign-in')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'different123')
    await page.fill('input[name="name"]', 'Second User')
    
    await page.click('button[data-testid="sign-up-submit"]')
    
    // Should show duplicate email error
    await expect(page.locator('.alert-error')).toBeVisible()
    await expect(page.locator('text=already')).toBeVisible()
  })
})
