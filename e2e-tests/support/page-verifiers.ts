import { expect, Page } from '@playwright/test'
import { getElementText, verifyElementExists } from './finders'

export async function verifyOnStartupPage(page: Page) {
  expect(await verifyElementExists(page, 'startup-page-banner')).toBe(true)
}

export async function verifyOnSignInPage(page: Page) {
  expect(await verifyElementExists(page, 'sign-in-page-banner')).toBe(true)
}

export async function verifyOnSignUpPage(page: Page) {
  expect(await verifyElementExists(page, 'sign-up-page-banner')).toBe(true)
}

export async function verifyOnInterestSignUpPage(page: Page) {
  expect(await verifyElementExists(page, 'interest-sign-up-page-banner')).toBe(true)
}

export async function verifyOnGatedSignUpPage(page: Page) {
  expect(await verifyElementExists(page, 'gated-sign-up-page-banner')).toBe(true)
}

export async function verifyOnProtectedPage(page: Page) {
  expect(await verifyElementExists(page, 'private-page-banner')).toBe(true)
}

export async function verifyOnAwaitVerificationPage(page: Page) {
  expect(await verifyElementExists(page, 'await-verification-page')).toBe(true)
}

export async function verifyOn404Page(page: Page) {
  expect(await verifyElementExists(page, '404-page-banner')).toBe(true)
  expect(await getElementText(page, '404-message')).toBe(
    'That page does not exist.'
  )
}

export async function verifyOnForgotPasswordPage(page: any) {
  expect(await verifyElementExists(page, 'forgot-password-page')).toBe(true)
}

export async function verifyOnWaitingForResetPage(page: any) {
  expect(await verifyElementExists(page, 'waiting-for-reset-page')).toBe(true)
}

export async function verifyOnResetPasswordPage(page: any) {
  expect(await verifyElementExists(page, 'reset-password-page')).toBe(true)
}

export async function verifyOnInvalidTokenPage(page: any) {
  expect(await verifyElementExists(page, 'invalid-token-page')).toBe(true)
}
