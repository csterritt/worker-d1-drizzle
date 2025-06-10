import { test, expect } from '@playwright/test'
import { getElementText, verifyAlert } from '../support/finders'
import {
  startSignIn,
  submitEmail,
  submitCode,
  signOutAndVerify,
} from '../support/auth-helpers'

const TEST_EMAIL = 'fredfred@team439980.testinator.com'
const TEST_CODE = '123456'

test.describe('Increment with DB Failures', () => {
  test('increment succeeds with 3 DB failures', async ({ page }) => {
    // Sign in first
    await page.goto('http://localhost:3000/home')
    await startSignIn(page)
    await submitEmail(page, TEST_EMAIL)
    await submitCode(page, TEST_CODE)

    // Set DB failures to 3
    await page.goto('http://localhost:3000/auth/set-db-failures/DB_FAIL_INCR/3')

    // Go to count page and get current value
    await page.goto('http://localhost:3000/count')
    const oldCount = parseInt(
      (await getElementText(page, 'count-value')) || '0',
      10
    )

    // Increment
    await page.click('[data-testid="increment-count-link"]')
    const newCount = parseInt(
      (await getElementText(page, 'count-value')) || '0',
      10
    )
    expect(newCount).toBeGreaterThan(oldCount)
    const pageContent = await page.content()
    expect(pageContent).not.toContain('Error')

    await signOutAndVerify(page)
  })

  test('increment fails with 7 DB failures', async ({ page }) => {
    // Sign in first
    await page.goto('http://localhost:3000/home')
    await startSignIn(page)
    await submitEmail(page, TEST_EMAIL)
    await submitCode(page, TEST_CODE)

    // Set DB failures to 7
    await page.goto('http://localhost:3000/auth/set-db-failures/DB_FAIL_INCR/7')

    // Go to count page and get current value
    await page.goto('http://localhost:3000/count')
    const oldCount = parseInt(
      (await getElementText(page, 'count-value')) || '0',
      10
    )

    // Increment
    await page.click('[data-testid="increment-count-link"]')
    // Should see error message
    await verifyAlert(page, 'Internal problem: Database error')

    await signOutAndVerify(page)
  })
})
