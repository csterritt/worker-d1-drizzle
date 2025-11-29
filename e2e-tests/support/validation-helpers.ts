import { Page } from '@playwright/test'
import { fillInput, clickLink, verifyAlert } from './finders'
import { INVALID_DATA, ERROR_MESSAGES } from './test-data'

/**
 * Validation helpers for common validation test patterns
 * Eliminates repeated validation testing sequences
 */

/**
 * Test email validation for any form
 */
export const testEmailValidation = async (
  page: Page,
  emailInputId: string,
  submitButtonId: string
) => {
  await fillInput(page, emailInputId, INVALID_DATA.EMAILS[0]) // 'invalid-email'
  await clickLink(page, submitButtonId)
  await verifyAlert(page, ERROR_MESSAGES.INVALID_EMAIL)
}

/**
 * Test required field validation
 */
export const testRequiredEmailField = async (
  page: Page,
  submitButtonId: string
) => {
  await clickLink(page, submitButtonId)
  await verifyAlert(page, ERROR_MESSAGES.INVALID_EMAIL)
}
