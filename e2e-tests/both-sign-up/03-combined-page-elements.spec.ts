import { test, expect } from '@playwright/test'

import { clickLink, isElementVisible } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { skipIfNotBothMode } from '../support/mode-helpers'
import { navigateToSignIn } from '../support/navigation-helpers'
import { BASE_URLS } from '../support/test-data'

test.describe('Both Sign-Up Mode: Combined Page Elements Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotBothMode()
  })

  test('combined sign-up page has both gated and interest form elements', async ({
    page,
  }) => {
    // Navigate to sign-up page
    await page.goto(BASE_URLS.SIGN_UP)

    // Verify gated sign-up form elements are present
    expect(await isElementVisible(page, 'gated-signup-code-input')).toBe(true)
    expect(await isElementVisible(page, 'gated-signup-name-input')).toBe(true)
    expect(await isElementVisible(page, 'gated-signup-email-input')).toBe(true)
    expect(await isElementVisible(page, 'gated-signup-password-input')).toBe(
      true
    )
    expect(await isElementVisible(page, 'gated-signup-action')).toBe(true)

    // Verify interest sign-up form elements are present
    expect(await isElementVisible(page, 'interest-email-input')).toBe(true)
    expect(await isElementVisible(page, 'interest-action')).toBe(true)

    // Verify navigation link is present
    expect(await isElementVisible(page, 'go-to-sign-in-action')).toBe(true)

    // Verify page has correct banner
    expect(
      await isElementVisible(page, 'gated-interest-sign-up-page-banner')
    ).toBe(true)
  })

  test('can navigate from combined sign-up page to sign-in page', async ({
    page,
  }) => {
    // Navigate to sign-up page
    await page.goto(BASE_URLS.SIGN_UP)

    // Click the "Sign In Instead" button to go to sign-in page
    await clickLink(page, 'go-to-sign-in-action')
    await verifyOnSignInPage(page)

    // Verify we're on the correct URL
    expect(page.url()).toContain('/auth/sign-in')
  })

  test('can navigate from sign-in page to combined sign-up page', async ({
    page,
  }) => {
    // Start on the sign-in page
    await navigateToSignIn(page)

    // Click the "Create Account" button to go to sign-up page
    await clickLink(page, 'go-to-sign-up-action')

    // Verify we're on the combined sign-up page
    expect(page.url()).toContain('/auth/sign-up')
    expect(
      await isElementVisible(page, 'gated-interest-sign-up-page-banner')
    ).toBe(true)
  })

  test('page displays both sections with appropriate headings', async ({
    page,
  }) => {
    // Navigate to sign-up page
    await page.goto(BASE_URLS.SIGN_UP)

    // Verify main heading
    const mainHeading = await page.locator('h2').textContent()
    expect(mainHeading).toContain('Create Account')

    // Verify section headings
    const sectionHeadings = await page.locator('h3').allTextContents()
    expect(sectionHeadings).toContain('Sign Up with Code')
    expect(sectionHeadings).toContain('Join the Waitlist')
  })
})
