import { Page, expect } from '@playwright/test'
import { verifyElementExists, getElementText } from './finders'

export async function verifyOnStartupPage(page: Page) {
  expect(await verifyElementExists(page, 'startup-page-banner')).toBe(true)
}

export async function verifyOnSignInPage(page: Page) {
  expect(await verifyElementExists(page, 'sign-in-page-banner')).toBe(true)
}

export async function verifyOnProtectedPage(page: Page) {
  expect(await verifyElementExists(page, 'private-page-banner')).toBe(true)
}

export async function verifyOn404Page(page: Page) {
  expect(await verifyElementExists(page, '404-page-banner')).toBe(true)
  expect(await getElementText(page, '404-message')).toBe(
    'That page does not exist.'
  )
}
