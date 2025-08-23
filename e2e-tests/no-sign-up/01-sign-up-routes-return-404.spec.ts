import { test } from '@playwright/test'
import { verifyOn404Page } from '../support/page-verifiers'
import { skipIfNotMode } from '../support/mode-helpers'

test.describe('No Sign-Up Mode: Sign-up routes return 404', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('NO_SIGN_UP')
  })
  test('visiting /auth/sign-up returns 404 page with proper banner', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/sign-up')
    await verifyOn404Page(page)
  })

  test('visiting /auth/await-verification returns 404 page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/await-verification')
    await verifyOn404Page(page)
  })

  test('visiting /auth/resend-email returns 404 page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/resend-email')
    await verifyOn404Page(page)
  })
})
