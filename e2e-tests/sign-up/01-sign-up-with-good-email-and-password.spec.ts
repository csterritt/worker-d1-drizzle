import { test, expect } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { completeSignUpFlow } from '../support/workflow-helpers'

test(
  'sign up with good email and password',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')

    // Complete the entire sign-up flow with default test user
    await completeSignUpFlow(page)

    // Verify the URL is the await verification page
    expect(page.url()).toContain('/auth/await-verification')
  })
)
