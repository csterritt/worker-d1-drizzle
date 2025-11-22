import { test } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import { verifyOnSignInPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToSignIn } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'

test(
  'shows validation errors for sign in form',
  testWithDatabase(async ({ page }) => {
    // Navigate to sign-in
    await navigateToSignIn(page)
    await verifyOnSignInPage(page)

    // Test empty submission
    await page.$eval(
      'form',
      (form: HTMLFormElement) => (form.noValidate = true)
    )
    await submitSignInForm(page, {
      email: '',
      password: '',
    })
    await verifyOnSignInPage(page)
    await verifyAlert(page, 'This field is required')

    // Test invalid email format
    await page.$eval(
      'form',
      (form: HTMLFormElement) => (form.noValidate = true)
    )
    await submitSignInForm(page, {
      email: 'invalid-email',
      password: 'somepassword',
    })
    await verifyOnSignInPage(page)
    await verifyAlert(page, 'Please enter a valid email address')

    // Test missing password
    await page.$eval(
      'form',
      (form: HTMLFormElement) => (form.noValidate = true)
    )
    await submitSignInForm(page, {
      email: 'valid@example.com',
      password: '',
    })
    await verifyOnSignInPage(page)
    await verifyAlert(page, 'This field is required')
  })
)
