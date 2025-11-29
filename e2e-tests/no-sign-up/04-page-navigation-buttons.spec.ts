import { test, expect } from '@playwright/test'

import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToSignIn } from '../support/navigation-helpers'

test.describe('No Sign-Up Mode: Sign-In Page', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('NO_SIGN_UP')
  })

  test('sign-in page has no sign-up button', async ({ page }) => {
    await navigateToSignIn(page)

    // In NO_SIGN_UP mode, the sign-up button should NOT be visible
    expect(
      await page.locator('[data-testid="go-to-sign-up-action"]').count()
    ).toBe(0)
  })
})
