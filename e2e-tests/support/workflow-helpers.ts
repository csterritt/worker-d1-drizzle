import { Page } from '@playwright/test'
import {
  navigateToSignUp,
  navigateToGatedSignUp,
  navigateToInterestSignUp,
  navigateToHome,
  navigateToForgotPassword,
} from './navigation-helpers'
import {
  submitSignUpForm,
  submitGatedSignUpForm,
  submitInterestSignUpForm,
  submitSignInForm,
  submitForgotPasswordForm,
  UserCredentials,
} from './form-helpers'
import {
  verifyOnAwaitVerificationPage,
  verifyOnSignInPage,
  verifyOnProtectedPage,
  verifyOnWaitingForResetPage,
} from './page-verifiers'
import { startSignIn } from './auth-helpers'
import { verifyAlert } from './finders'
import { TEST_USERS, GATED_CODES, ERROR_MESSAGES } from './test-data'

/**
 * Workflow helpers for complete multi-step processes
 * Eliminates repeated complex workflows across tests
 */

/**
 * Complete sign-up workflow (navigate → fill → submit → verify redirect)
 */
export const completeSignUpFlow = async (
  page: Page,
  user: UserCredentials = TEST_USERS.NEW_USER
) => {
  await navigateToSignUp(page)
  await submitSignUpForm(page, user)
  await verifyOnAwaitVerificationPage(page)
}

/**
 * Complete gated sign-up workflow
 */
export const completeGatedSignUpFlow = async (
  page: Page,
  code: string = GATED_CODES.WELCOME,
  user: UserCredentials = TEST_USERS.GATED_USER
) => {
  await navigateToGatedSignUp(page)
  await submitGatedSignUpForm(page, { code, ...user })
  await verifyOnAwaitVerificationPage(page)
}

/**
 * Complete interest sign-up workflow (waitlist)
 */
export const completeInterestSignUpFlow = async (
  page: Page,
  email: string = TEST_USERS.INTERESTED_USER.email
) => {
  await navigateToInterestSignUp(page)
  await submitInterestSignUpForm(page, email)
  await verifyOnSignInPage(page)
  await verifyAlert(page, ERROR_MESSAGES.WAITLIST_SUCCESS)
}

/**
 * Complete sign-in workflow (navigate to home → sign-in → fill → submit → verify)
 */
export const completeSignInFlow = async (
  page: Page,
  user = TEST_USERS.KNOWN_USER
) => {
  await navigateToHome(page)
  await startSignIn(page)
  await submitSignInForm(page, user)
  await verifyAlert(page, ERROR_MESSAGES.SIGN_IN_SUCCESS)
  await verifyOnProtectedPage(page)
}

/**
 * Complete forgot password workflow
 */
export const completeForgotPasswordFlow = async (
  page: Page,
  email: string = TEST_USERS.KNOWN_USER.email
) => {
  await navigateToForgotPassword(page)
  await submitForgotPasswordForm(page, email)
  await verifyOnWaitingForResetPage(page)
  await verifyAlert(page, ERROR_MESSAGES.RESET_LINK_SENT)
}

/**
 * Test duplicate email scenario for sign-up
 */
export const testDuplicateSignUpFlow = async (
  page: Page,
  user: UserCredentials = TEST_USERS.DUPLICATE_USER
) => {
  // First sign-up
  await completeSignUpFlow(page, user)

  // Attempt duplicate sign-up
  await navigateToSignUp(page)
  await submitSignUpForm(page, user)
  await verifyOnAwaitVerificationPage(page)
  await verifyAlert(page, ERROR_MESSAGES.DUPLICATE_EMAIL)
}

/**
 * Test duplicate email scenario for gated sign-up
 */
export const testDuplicateGatedSignUpFlow = async (
  page: Page,
  firstCode: string = GATED_CODES.WELCOME,
  secondCode: string = GATED_CODES.BETA,
  user: UserCredentials = TEST_USERS.DUPLICATE_USER
) => {
  // First sign-up with first code
  await completeGatedSignUpFlow(page, firstCode, user)

  // Attempt duplicate sign-up with different code
  await navigateToGatedSignUp(page)
  await submitGatedSignUpForm(page, { code: secondCode, ...user })
  await verifyOnAwaitVerificationPage(page)
  await verifyAlert(page, ERROR_MESSAGES.DUPLICATE_EMAIL)
}

/**
 * Test duplicate email scenario for interest sign-up (waitlist)
 */
export const testDuplicateInterestSignUpFlow = async (
  page: Page,
  email: string = TEST_USERS.DUPLICATE_USER.email
) => {
  // First submission
  await completeInterestSignUpFlow(page, email)

  // Attempt duplicate submission
  await navigateToInterestSignUp(page)
  await submitInterestSignUpForm(page, email)
  await verifyOnSignInPage(page)
  await verifyAlert(page, ERROR_MESSAGES.ALREADY_ON_WAITLIST)
}

/**
 * Complete sign-up then attempt unverified sign-in workflow
 */
export const signUpThenAttemptUnverifiedSignIn = async (
  page: Page,
  user: UserCredentials = TEST_USERS.NEW_USER
) => {
  // Complete sign-up
  await completeSignUpFlow(page, user)

  // Attempt to sign in before verification
  await navigateToHome(page)
  await startSignIn(page)
  await submitSignInForm(page, { email: user.email, password: user.password })
  await verifyAlert(page, ERROR_MESSAGES.EMAIL_NOT_VERIFIED)
}
