import { test } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotBothMode } from '../support/mode-helpers'
import {
  completeGatedSignUpFlowBothMode,
  testDuplicateGatedSignUpFlowBothMode,
} from '../support/workflow-helpers'

test.describe('Both Sign-Up Mode: Gated Sign-Up Tests', () => {
  test.beforeEach(async () => {
    await skipIfNotBothMode()
  })

  test(
    'can sign up with valid gated code and creates account',
    testWithDatabase(async ({ page }) => {
      // Complete the entire gated sign-up flow with default code and user
      await completeGatedSignUpFlowBothMode(page)
    })
  )

  test(
    'handles duplicate email properly for gated sign-up',
    testWithDatabase(async ({ page }) => {
      // Use workflow helper for complete duplicate gated sign-up flow testing
      await testDuplicateGatedSignUpFlowBothMode(page)
    })
  )
})
