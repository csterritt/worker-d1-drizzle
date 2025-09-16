import { test, expect } from '@playwright/test'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { verifyElementExists } from '../support/finders'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToSignIn } from '../support/navigation-helpers'

test.describe('No Sign-Up Mode: Sign-in page has no sign-up links', () => {
  test.beforeEach(async () => {
    await skipIfNotMode('NO_SIGN_UP')
  })

  test('sign-in page does not contain "Create Account" button', async ({
    page,
  }) => {
    await navigateToSignIn(page)

    // Verify the "Create Account" button (go-to-sign-up-action) does not exist
    const signUpButton = page.getByTestId('go-to-sign-up-action')
    const signUpButtonCount = await signUpButton.count()
    expect(signUpButtonCount).toBe(0)
  })

  test('sign-in page does not contain any links to sign-up', async ({
    page,
  }) => {
    await navigateToSignIn(page)

    // Check that there are no links pointing to the sign-up page
    const signUpLinks = page.locator('a[href="/auth/sign-up"]')
    const signUpLinkCount = await signUpLinks.count()
    expect(signUpLinkCount).toBe(0)
  })

  test('sign-in page does not contain "New user?" divider text', async ({
    page,
  }) => {
    await navigateToSignIn(page)

    // Check that the "New user?" divider text is not present
    const dividerText = page.locator('text=New user?')
    const dividerExists = await dividerText.count()
    expect(dividerExists).toBe(0)
  })

  test('sign-in page still contains forgot password link', async ({ page }) => {
    await navigateToSignIn(page)

    // Verify that forgot password link still exists (should not be removed)
    const forgotPasswordExists = await verifyElementExists(
      page,
      'forgot-password-action'
    )
    expect(forgotPasswordExists).toBe(true)
  })
})
