import { Page } from '@playwright/test'
import { fillInput, clickLink } from './finders'
import { TEST_USERS } from './test-data'

/**
 * Form helpers for common form submission patterns
 * Eliminates repeated form filling sequences across tests
 */

export interface UserCredentials {
  name: string
  email: string
  password: string
}

export interface GatedSignUpData {
  code: string
  name: string
  email: string
  password: string
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Standard sign-up form (open sign-up mode)
 */
export const submitSignUpForm = async (
  page: Page,
  user: UserCredentials = TEST_USERS.NEW_USER
) => {
  await fillInput(page, 'signup-name-input', user.name)
  await fillInput(page, 'signup-email-input', user.email)
  await fillInput(page, 'signup-password-input', user.password)
  await clickLink(page, 'signup-submit')
}

/**
 * Gated sign-up form (requires code)
 */
export const submitGatedSignUpForm = async (
  page: Page,
  data: GatedSignUpData
) => {
  await fillInput(page, 'gated-signup-code-input', data.code)
  await fillInput(page, 'gated-signup-name-input', data.name)
  await fillInput(page, 'gated-signup-email-input', data.email)
  await fillInput(page, 'gated-signup-password-input', data.password)
  await clickLink(page, 'gated-signup-submit')
}

/**
 * Sign-in form
 */
export const submitSignInForm = async (
  page: Page,
  user: SignInData = TEST_USERS.KNOWN_USER
) => {
  await fillInput(page, 'email-input', user.email)
  await fillInput(page, 'password-input', user.password)
  await clickLink(page, 'submit')
}

/**
 * Interest sign-up form (waitlist)
 */
export const submitInterestSignUpForm = async (
  page: Page,
  email: string = TEST_USERS.INTERESTED_USER.email
) => {
  await fillInput(page, 'interest-email-input', email)
  await clickLink(page, 'interest-submit')
}

/**
 * Forgot password form
 */
export const submitForgotPasswordForm = async (
  page: Page,
  email: string = TEST_USERS.KNOWN_USER.email
) => {
  await fillInput(page, 'forgot-email-input', email)
  await clickLink(page, 'forgot-password-submit')
}

/**
 * Reset password form
 */
export const submitResetPasswordForm = async (
  page: Page,
  newPassword: string = TEST_USERS.RESET_USER.password
) => {
  await fillInput(page, 'new-password-input', newPassword)
  await fillInput(page, 'confirm-password-input', newPassword)
  await clickLink(page, 'reset-password-submit')
}

/**
 * Partial form fills for validation testing
 */
export const fillSignUpFormPartial = async (
  page: Page,
  fields: Partial<UserCredentials>
) => {
  if (fields.name) await fillInput(page, 'signup-name-input', fields.name)
  if (fields.email) await fillInput(page, 'signup-email-input', fields.email)
  if (fields.password)
    await fillInput(page, 'signup-password-input', fields.password)
}

export const fillSignInFormPartial = async (
  page: Page,
  fields: Partial<SignInData>
) => {
  if (fields.email) await fillInput(page, 'email-input', fields.email)
  if (fields.password) await fillInput(page, 'password-input', fields.password)
}

export const fillGatedSignUpFormPartial = async (
  page: Page,
  fields: Partial<GatedSignUpData>
) => {
  if (fields.code) await fillInput(page, 'gated-signup-code-input', fields.code)
  if (fields.name) await fillInput(page, 'gated-signup-name-input', fields.name)
  if (fields.email)
    await fillInput(page, 'gated-signup-email-input', fields.email)
  if (fields.password)
    await fillInput(page, 'gated-signup-password-input', fields.password)
}

/**
 * Form submission without filling (for testing empty form validation)
 */
export const submitEmptySignUpForm = async (page: Page) => {
  await clickLink(page, 'signup-submit')
}

export const submitEmptySignInForm = async (page: Page) => {
  await clickLink(page, 'submit')
}

export const submitEmptyGatedSignUpForm = async (page: Page) => {
  await clickLink(page, 'gated-signup-submit')
}

export const submitEmptyForgotPasswordForm = async (page: Page) => {
  await clickLink(page, 'forgot-password-submit')
}
