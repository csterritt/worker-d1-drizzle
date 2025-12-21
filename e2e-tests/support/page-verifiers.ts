import { expect, Page } from '@playwright/test'
import { getElementText, verifyElementExists } from './finders'

export const verifyOnStartupPage = async (page: Page) => {
  expect(await verifyElementExists(page, 'startup-page-banner')).toBe(true)
}

export const verifyOnSignInPage = async (page: Page) => {
  expect(await verifyElementExists(page, 'sign-in-page-banner')).toBe(true)
}

/**
 * Unified sign-up page verifier - works for gated, interest, and both modes
 */
export const verifyOnSignUpPage = async (page: Page) => {
  expect(await verifyElementExists(page, 'sign-up-page-banner')).toBe(true)
}

// Aliases for backward compatibility - all use the same unified banner
export const verifyOnInterestSignUpPage = verifyOnSignUpPage
export const verifyOnGatedSignUpPage = verifyOnSignUpPage

export const verifyOnProtectedPage = async (page: Page) => {
  expect(await verifyElementExists(page, 'private-page-banner')).toBe(true)
}

export const verifyOnAwaitVerificationPage = async (page: Page) => {
  expect(await verifyElementExists(page, 'await-verification-page')).toBe(true)
}

export const verifyOn404Page = async (page: Page) => {
  expect(await verifyElementExists(page, '404-page-banner')).toBe(true)
  expect(await getElementText(page, '404-message')).toBe(
    'That page does not exist.'
  )
}

export const verifyOnForgotPasswordPage = async (page: any) => {
  expect(await verifyElementExists(page, 'forgot-password-page')).toBe(true)
}

export const verifyOnWaitingForResetPage = async (page: any) => {
  expect(await verifyElementExists(page, 'waiting-for-reset-page')).toBe(true)
}

export const verifyOnResetPasswordPage = async (page: any) => {
  expect(await verifyElementExists(page, 'reset-password-page')).toBe(true)
}

export const verifyOnInvalidTokenPage = async (page: any) => {
  expect(await verifyElementExists(page, 'invalid-token-page')).toBe(true)
}

export const verifyOnProfilePage = async (page: Page) => {
  expect(await verifyElementExists(page, 'profile-page')).toBe(true)
}

export const verifyOnDeleteConfirmPage = async (page: Page) => {
  expect(await verifyElementExists(page, 'delete-confirm-page')).toBe(true)
}

export const verifyOnSignOutPage = async (page: Page) => {
  expect(await verifyElementExists(page, 'sign-out-page')).toBe(true)
}
