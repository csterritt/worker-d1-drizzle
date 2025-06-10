import { test, expect } from '@playwright/test'

import { clickLink, getElementText } from '../support/finders'
import { verifyOnStartupPage } from '../support/page-verifiers'

// This test verifies that the count page displays a numeric count value

test.describe('Count Page', () => {
  test('shows a numeric value for the count', async ({ page }) => {
    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/home')
    await verifyOnStartupPage(page)
    await clickLink(page, 'visit-count-link')
    // Find the element that displays the count value
    const countText = await getElementText(page, 'count-value')
    expect(countText).not.toBeNull()
    // Should be a number (not NaN, not empty)
    expect(countText).toMatch(/^\d+$/)
  })
})
