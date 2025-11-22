import { test } from '@playwright/test'

import { verifyAlert } from '../support/finders'
import { verifyOnSignUpPage } from '../support/page-verifiers'
import { testWithDatabase } from '../support/test-helpers'
import { skipIfNotMode } from '../support/mode-helpers'
import { navigateToSignUp } from '../support/navigation-helpers'
import { submitSignUpForm } from '../support/form-helpers'

test(
  'shows validation errors for sign up form',
  testWithDatabase(async ({ page }) => {
    await skipIfNotMode('OPEN_SIGN_UP')
    // Navigate to sign-up
    await navigateToSignUp(page)
    await verifyOnSignUpPage(page)

    // Test empty submission
    await page.$eval(
      'form',
      (form: HTMLFormElement) => (form.noValidate = true)
    )
    await submitSignUpForm(page, {
      name: '',
      email: '',
      password: '',
    })
    await verifyOnSignUpPage(page)
    await verifyAlert(page, 'This field is required')

    // Test missing name
    await page.$eval(
      'form',
      (form: HTMLFormElement) => (form.noValidate = true)
    )
    await submitSignUpForm(page, {
      name: '',
      email: 'valid@example.com',
      password: 'validpassword123',
    })
    await verifyOnSignUpPage(page)
    await verifyAlert(page, 'This field is required')

    // Test invalid email
    await page.$eval(
      'form',
      (form: HTMLFormElement) => (form.noValidate = true)
    )
    await submitSignUpForm(page, {
      name: 'Test User',
      email: 'invalid-email',
      password: 'validpassword123',
    })
    await verifyOnSignUpPage(page)
    await verifyAlert(page, 'Please enter a valid email address')

    // Test short password
    await page.$eval(
      'form',
      (form: HTMLFormElement) => (form.noValidate = true)
    )
    await submitSignUpForm(page, {
      name: 'Test User',
      email: 'valid@example.com',
      password: 'short',
    })
    await verifyOnSignUpPage(page)
    await verifyAlert(page, 'Password must be at least 8 characters long.')
  })
)
