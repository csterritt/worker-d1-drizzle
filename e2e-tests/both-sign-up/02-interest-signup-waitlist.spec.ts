import { test } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotBothMode } from '../support/mode-helpers'
import {
  completeInterestSignUpFlowBothMode,
  testDuplicateInterestSignUpFlowBothMode,
} from '../support/workflow-helpers'

test.describe('Both Sign-Up Mode: Interest Sign-Up Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotBothMode()
  })

  test(
    'can join waitlist with valid email and get success message',
    testWithDatabase(async ({ page }) => {
      // Complete the entire interest sign-up flow
      await completeInterestSignUpFlowBothMode(page)
    })
  )

  test(
    'shows friendly message when email is already on waitlist',
    testWithDatabase(async ({ page }) => {
      // Test the complete duplicate interest sign-up flow
      await testDuplicateInterestSignUpFlowBothMode(page)
    })
  )
})
