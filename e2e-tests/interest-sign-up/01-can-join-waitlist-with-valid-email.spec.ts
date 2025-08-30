import { test } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  completeInterestSignUpFlow,
  testDuplicateInterestSignUpFlow,
} from '../support/workflow-helpers'

test.describe('Interest Sign-Up Mode: Valid Email Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('INTEREST_SIGN_UP')
  })

  test(
    'can join waitlist with valid email and get success message',
    testWithDatabase(async ({ page }) => {
      // Complete the entire interest sign-up flow
      await completeInterestSignUpFlow(page)
    })
  )

  test(
    'shows friendly message when email is already on waitlist',
    testWithDatabase(async ({ page }) => {
      // Test the complete duplicate interest sign-up flow
      await testDuplicateInterestSignUpFlow(page)
    })
  )
})
