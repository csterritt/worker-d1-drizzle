import { expect, Page } from '@playwright/test' // UNREVIEWED

export const clickLink = async (page: Page, testId: string) => {
  return page.getByTestId(testId).first().click()
}

export const fillInput = async (page: Page, testId: string, value: string) => {
  return page.getByTestId(testId).fill(value)
}

export const verifyAlert = async (page: Page, expectedText: string) => {
  return await expect(page.getByRole('alert')).toHaveText(expectedText)
  // return page.getByTestId('alert-close').click()
}

export const verifyElementExists = async (
  page: Page,
  testId: string
): Promise<boolean> => {
  try {
    const element = page.getByTestId(testId)
    await element.waitFor()
    return true
  } catch {
    return false
  }
}

export const getElementText = async (
  page: Page,
  testId: string
): Promise<string | null> => {
  try {
    const element = page.getByTestId(testId)
    await element.waitFor()
    return element.textContent()
  } catch {
    return null
  }
}

export const isElementVisible = async (
  page: Page,
  testId: string
): Promise<boolean> => {
  return page
    .locator(`[data-testid="${testId}"]`)
    .isVisible()
    .catch(() => false)
}
