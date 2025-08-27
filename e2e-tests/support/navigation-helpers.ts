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
  verifyOnResetPasswordPage,
  verifyOn404Page
} from './page-verifiers'

/**
 * Navigation helpers that combine page.goto() with verification
 * Eliminates repeated navigation + waitForSelector/verification patterns
 */

export async function navigateToHome(page: Page) {
  await page.goto(BASE_URLS.HOME)
  await verifyOnStartupPage(page)
}

export async function navigateToSignIn(page: Page) {
  await page.goto(BASE_URLS.SIGN_IN)
  await verifyOnSignInPage(page)
}

export async function navigateToSignUp(page: Page) {
  await page.goto(BASE_URLS.SIGN_UP)
  await verifyOnSignUpPage(page)
}

export async function navigateToInterestSignUp(page: Page) {
  await page.goto(BASE_URLS.INTEREST_SIGN_UP)
  await verifyOnInterestSignUpPage(page)
}

export async function navigateToGatedSignUp(page: Page) {
  await page.goto(BASE_URLS.SIGN_UP)
  await verifyOnGatedSignUpPage(page)
}

export async function navigateToForgotPassword(page: Page) {
  await page.goto(BASE_URLS.FORGOT_PASSWORD)
  await verifyOnForgotPasswordPage(page)
}

export async function navigateToAwaitVerification(page: Page) {
  await page.goto(BASE_URLS.AWAIT_VERIFICATION)
  await verifyOnAwaitVerificationPage(page)
}

export async function navigateToWaitingForReset(page: Page) {
  await page.goto(BASE_URLS.WAITING_FOR_RESET)
  await verifyOnWaitingForResetPage(page)
}

export async function navigateToPrivatePage(page: Page) {
  await page.goto(BASE_URLS.PRIVATE)
  await verifyOnProtectedPage(page)
}

/**
 * Navigation helpers for testing 404 routes
 */
export async function navigateTo404Route(page: Page, route: string) {
  await page.goto(`${BASE_URLS.HOME}${route}`)
  await verifyOn404Page(page)
}

/**
 * Helper for navigating to routes that should return 404 in certain modes
 */
export async function expectRoute404(page: Page, route: string) {
  await page.goto(`${BASE_URLS.HOME}${route}`)
  await verifyOn404Page(page)
}
