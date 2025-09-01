import { test } from '@playwright/test'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateTo404Route } from '../support/navigation-helpers'

test.describe('No Sign-Up Mode: Sign-up routes return 404', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('NO_SIGN_UP')
  })

  test('visiting /auth/sign-up returns 404 page with proper banner', async ({
    page,
  }) => {
    await navigateTo404Route(page, '/auth/sign-up')
  })

  test('visiting /auth/await-verification returns 404 page', async ({
    page,
  }) => {
    await navigateTo404Route(page, '/auth/await-verification')
  })

  test('visiting /auth/resend-email returns 404 page', async ({ page }) => {
    await navigateTo404Route(page, '/auth/resend-email')
  })
})
