import { Page } from '@playwright/test'
import { BASE_URLS } from './test-data'
import {
  verifyOnStartupPage,
  verifyOnSignInPage,
  verifyOnSignUpPage,
  verifyOnProfilePage,
  verifyOnProtectedPage,
  verifyOnAwaitVerificationPage,
  verifyOnForgotPasswordPage,
  verifyOnWaitingForResetPage,
  verifyOn404Page,
} from './page-verifiers'
import { detectSignUpMode } from './mode-helpers'

/**
 * Navigation helpers that combine page.goto() with verification
 * Eliminates repeated navigation + waitForSelector/verification patterns
 */

export const navigateToHome = async (page: Page) => {
  await page.goto(BASE_URLS.HOME)
  await verifyOnStartupPage(page)
}

export const navigateToSignIn = async (page: Page) => {
  await page.goto(BASE_URLS.SIGN_IN)
  await verifyOnSignInPage(page)
}

export const navigateToSignUp = async (page: Page) => {
  await page.goto(BASE_URLS.SIGN_UP)
  await verifyOnSignUpPage(page)
}

/**
 * Navigate to interest sign-up page
 * Uses /auth/interest-sign-up in INTEREST_SIGN_UP mode, /auth/sign-up in BOTH_SIGN_UP mode
 */
export const navigateToInterestSignUp = async (page: Page) => {
  const mode = await detectSignUpMode()
  const url =
    mode === 'INTEREST_SIGN_UP' ? BASE_URLS.INTEREST_SIGN_UP : BASE_URLS.SIGN_UP
  await page.goto(url)
  await verifyOnSignUpPage(page)
}

/**
 * Navigate to gated sign-up page
 * Works for both GATED_SIGN_UP and BOTH_SIGN_UP modes
 */
export const navigateToGatedSignUp = async (page: Page) => {
  await page.goto(BASE_URLS.SIGN_UP)
  await verifyOnSignUpPage(page)
}

export const navigateToForgotPassword = async (page: Page) => {
  await page.goto(BASE_URLS.FORGOT_PASSWORD)
  await verifyOnForgotPasswordPage(page)
}

export const navigateToAwaitVerification = async (page: Page) => {
  await page.goto(BASE_URLS.AWAIT_VERIFICATION)
  await verifyOnAwaitVerificationPage(page)
}

export const navigateToWaitingForReset = async (page: Page) => {
  await page.goto(BASE_URLS.WAITING_FOR_RESET)
  await verifyOnWaitingForResetPage(page)
}

export const navigateToPrivatePage = async (page: Page) => {
  await page.goto(BASE_URLS.PRIVATE)
  await verifyOnProtectedPage(page)
}

export const navigateToProfile = async (page: Page) => {
  await page.goto(BASE_URLS.PROFILE)
  await verifyOnProfilePage(page)
}

/**
 * Navigation helper for testing 404 routes
 */
export const navigateTo404Route = async (page: Page, route: string) => {
  await page.goto(`${BASE_URLS.HOME}${route}`)
  await verifyOn404Page(page)
}
