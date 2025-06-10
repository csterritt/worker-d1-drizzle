import { test, expect } from '@playwright/test'

import { getElementText } from '../support/finders'
import { describe } from 'node:test'

// This test verifies that after setting DB failures to 3, the count page still shows a number and no error message

describe('Count Page with DB Failures', () => {
  test('count page shows a number and no error after setting DB failures to 3', async ({
    page,
    request,
  }) => {
    // Set DB failures to 3
    await page.goto(
      'http://localhost:3000/auth/set-db-failures/DB_FAIL_COUNT/3'
    )

    // Visit the count page
    await page.goto('http://localhost:3000/count')

    // Get count value text
    const countText = await getElementText(page, 'count-value')
    expect(countText).not.toBeNull()
    // Should be a number (not NaN, not empty, no error message)
    expect(countText).toMatch(/^\d+$/)

    // Optionally, check that no error is present in the page
    const pageContent = await page.content()
    expect(pageContent).not.toContain('Error')
  })

  test('count page shows no number and a database error after setting DB failures to 6', async ({
    page,
    request,
  }) => {
    // Set DB failures to 6
    await page.goto(
      'http://localhost:3000/auth/set-db-failures/DB_FAIL_COUNT/7'
    )

    // Visit the count page
    await page.goto('http://localhost:3000/count')

    // Get count value text
    const countText = await getElementText(page, 'count-value')
    expect(countText).toMatch('Internal problem: Database error')
  })
})
