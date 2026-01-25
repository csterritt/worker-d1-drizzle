import { test } from '@playwright/test'

import { verifyOnWaitingForResetPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToForgotPassword } from '../support/navigation-helpers'
import { submitForgotPasswordForm } from '../support/form-helpers'
import { TEST_USERS } from '../support/test-data'

test(
  'redirects to waiting page even when email send fails in background',
  testWithDatabase(async ({ page, request }) => {
    // Navigate to forgot password page
    await navigateToForgotPassword(page)

    // Set invalid SMTP configuration to force email send failure
    // This simulates a real email sending error
    await request.post('http://localhost:3000/test/set-smtp-config', {
      data: {
        host: 'invalid.smtp.server',
        port: 9999,
      },
    })

    // Submit forgot password form with valid user email
    await submitForgotPasswordForm(page, TEST_USERS.KNOWN_USER.email)

    // Should redirect to waiting page (better-auth runs email sending in background)
    // The email will fail in the background, but the user sees the waiting page
    // This prevents timing attacks and email enumeration
    await verifyOnWaitingForResetPage(page)

    // Reset SMTP configuration for other tests
    await request.post('http://localhost:3000/test/reset-smtp-config')
  })
)
