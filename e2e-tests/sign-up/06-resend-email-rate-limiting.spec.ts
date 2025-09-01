import { test, expect } from '@playwright/test'
import {} from '../support/finders'
import {
  verifyOnSignUpPage,
  verifyOnAwaitVerificationPage,
} from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToSignUp } from '../support/navigation-helpers'
import { submitSignUpForm } from '../support/form-helpers'

test(
  'resend email button enforces rate limiting from first attempt',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up page and submit form
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // Sign up with new credentials
    const newName = 'Rate Limit Test User'
    const newEmail = 'ratelimituser@example.com'
    const newPassword = 'ratelimitpassword123'

    await submitSignUpForm(page, {
      name: newName,
      email: newEmail,
      password: newPassword,
    })

    // Should be redirected to await verification page
    await verifyOnAwaitVerificationPage(page)

    // Verify the resend button is available
    const resendButton = page.getByTestId('resend-email-button')
    await expect(resendButton).toBeVisible()

    // Click resend email button for the first time (should now be rate limited since initial email was just sent)
    await resendButton.click()

    // Should get rate limiting message on first attempt since we now track initial email send time
    const alertElement = page.getByRole('alert')
    await expect(alertElement).toContainText('Please wait')
    await expect(alertElement).toContainText('second')
    await expect(alertElement).toContainText(
      'before requesting another verification email'
    )

    // Should still be on await verification page
    await verifyOnAwaitVerificationPage(page)

    // Try to click resend button again immediately (should still be rate limited)
    await resendButton.click()

    // Should still get rate limiting message
    await expect(alertElement).toContainText('Please wait')
    await expect(alertElement).toContainText('second')
    await expect(alertElement).toContainText(
      'before requesting another verification email'
    )

    // Should still be on await verification page
    await verifyOnAwaitVerificationPage(page)

    // Verify the resend button is still available (not disabled)
    await expect(resendButton).toBeVisible()
  })
)
