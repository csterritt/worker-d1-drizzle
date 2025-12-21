import { Page } from '@playwright/test'
import { clickLink, fillInput } from './finders'
import {
  verifyOnSignInPage,
  verifyOnStartupPage,
  verifyOnProtectedPage,
  verifyOnSignOutPage,
} from './page-verifiers'

export const signOutAndVerify = async (page: Page) => {
  await clickLink(page, 'sign-out-action')
  await verifyOnSignOutPage(page)
  await clickLink(page, 'go-home-action')
  await verifyOnStartupPage(page)
}

export const startSignIn = async (page: Page) => {
  // Click the Sign In link on the home page
  await clickLink(page, 'sign-in-action')
  // Verify we're on the sign-in page
  await verifyOnSignInPage(page)
}

export const signInUser = async (
  page: Page,
  email: string,
  password: string
) => {
  // Navigate to sign-in page if not already there
  await startSignIn(page)

  // Fill and submit login form
  await fillInput(page, 'email-input', email)
  await fillInput(page, 'password-input', password)
  await clickLink(page, 'submit')
  // For successful login, we should be redirected to the protected page
  await verifyOnProtectedPage(page)
}
