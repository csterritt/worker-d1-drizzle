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

export const testRequiredPasswordField = async (
  page: Page,
  submitButtonId: string
) => {
  await clickLink(page, submitButtonId)
  await verifyAlert(page, ERROR_MESSAGES.PASSWORD_REQUIRED)
}

export const testRequiredNameField = async (
  page: Page,
  submitButtonId: string
) => {
  await clickLink(page, submitButtonId)
  await verifyAlert(page, ERROR_MESSAGES.NAME_REQUIRED)
}

export const testRequiredCodeField = async (
  page: Page,
  submitButtonId: string
) => {
  await clickLink(page, submitButtonId)
  await verifyAlert(page, ERROR_MESSAGES.CODE_REQUIRED)
}

/**
 * Test invalid code validation (for gated sign-up)
 */
export const testInvalidCodeValidation = async (
  page: Page,
  codeInputId: string,
  submitButtonId: string
) => {
  await fillInput(page, codeInputId, INVALID_DATA.CODES[0]) // 'INVALID-CODE'
  await clickLink(page, submitButtonId)
  await verifyAlert(page, ERROR_MESSAGES.INVALID_CODE)
}

/**
 * Comprehensive form validation test helper
 * Tests multiple validation scenarios for a form
 */
export interface FormValidationConfig {
  emailInputId?: string
  passwordInputId?: string
  nameInputId?: string
  codeInputId?: string
  submitButtonId: string
}

export const testFormValidation = async (
  page: Page,
  config: FormValidationConfig
) => {
  // Test required fields
  if (config.emailInputId) {
    await testRequiredEmailField(page, config.submitButtonId)
  }

  if (config.passwordInputId) {
    await testRequiredPasswordField(page, config.submitButtonId)
  }

  if (config.nameInputId) {
    await testRequiredNameField(page, config.submitButtonId)
  }

  if (config.codeInputId) {
    await testRequiredCodeField(page, config.submitButtonId)
  }

  // Test email validation if email field exists
  if (config.emailInputId) {
    await testEmailValidation(page, config.emailInputId, config.submitButtonId)
  }

  // Test code validation if code field exists
  if (config.codeInputId) {
    await testInvalidCodeValidation(
      page,
      config.codeInputId,
      config.submitButtonId
    )
  }
}

export const testInterestSignUpFormValidation = async (page: Page) => {
  await testFormValidation(page, {
    emailInputId: 'interest-email-input',
    submitButtonId: 'interest-action',
  })
}
