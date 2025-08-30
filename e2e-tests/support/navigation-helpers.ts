import { Page } from '@playwright/test'
import { BASE_URLS } from './test-data'
import {
  verifyOnStartupPage,
  verifyOnSignInPage,
  verifyOnSignUpPage,
  verifyOnInterestSignUpPage,
  verifyOnGatedSignUpPage,
  verifyOnProtectedPage,
  verifyOnAwaitVerificationPage,
  verifyOnForgotPasswordPage,
  verifyOnWaitingForResetPage,
  verifyOn404Page,
} from './page-verifiers'

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

export const navigateToInterestSignUp = async (page: Page) => {
  await page.goto(BASE_URLS.INTEREST_SIGN_UP)
  await verifyOnInterestSignUpPage(page)
}

export const navigateToGatedSignUp = async (page: Page) => {
  await page.goto(BASE_URLS.SIGN_UP)
  await verifyOnGatedSignUpPage(page)
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

/**
 * Navigation helpers for testing 404 routes
 */
export const navigateTo404Route = async (page: Page, route: string) => {
  await page.goto(`${BASE_URLS.HOME}${route}`)
  await verifyOn404Page(page)
}

/**
 * Helper for navigating to routes that should return 404 in certain modes
 */
export const expectRoute404 = async (page: Page, route: string) => {
  await page.goto(`${BASE_URLS.HOME}${route}`)
  await verifyOn404Page(page)
}
