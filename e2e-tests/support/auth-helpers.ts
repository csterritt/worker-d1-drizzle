import { Page } from '@playwright/test'
import { clickLink, fillInput } from './finders'
import {
  verifyOnStartupPage,
  verifyOnSignInPage,
  verifyOnProtectedPage,
} from './page-verifiers'

export const signOutAndVerify = async (page: Page) => {
  await clickLink(page, 'sign-out-action')
  await verifyOnStartupPage(page)
}

export const startSignIn = async (page: Page) => {
  // Click the Sign In link on the home page
  await clickLink(page, 'sign-in-action')
  // Verify we're on the sign-in page
  await verifyOnSignInPage(page)
}

export const submitEmailAndPassword = async (
  page: Page,
  email: string,
  password: string
) => {
  await fillInput(page, 'email-input', email)
  await fillInput(page, 'password-input', password)
  await clickLink(page, 'submit')
  // For successful login, we should be redirected to the protected page
  await verifyOnProtectedPage(page)
}

export const signInUser = async (
  page: Page,
  email: string,
  password: string
) => {
  // Navigate to sign-in page if not already there
  await startSignIn(page)

  // Fill and submit login form
  await submitEmailAndPassword(page, email, password)
}
