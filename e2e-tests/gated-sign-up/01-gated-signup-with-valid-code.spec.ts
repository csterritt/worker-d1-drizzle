import { test } from '@playwright/test'

import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import {
  completeGatedSignUpFlow,
  testDuplicateGatedSignUpFlow,
} from '../support/workflow-helpers'

test.describe('Gated Sign-Up Mode: Valid Code Tests', () => {
  test.beforeEach(async ({ page }) => {
    await skipIfNotMode('GATED_SIGN_UP')
  })

  test(
    'can sign up with valid gated code and creates account',
    testWithDatabase(async ({ page }) => {
      // Complete the entire gated sign-up flow with default code and user
      await completeGatedSignUpFlow(page)
    })
  )

  test(
    'handles duplicate email properly for gated sign-up',
    testWithDatabase(async ({ page }) => {
      // Use workflow helper for complete duplicate gated sign-up flow testing
      await testDuplicateGatedSignUpFlow(page)
    })
  )
})
