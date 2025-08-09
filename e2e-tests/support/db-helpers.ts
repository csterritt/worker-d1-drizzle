/**
 * Database helpers for e2e tests
 * Provides functions to clear and seed test database via server endpoints
 * Also provides smtp-tester mail server for email testing
 */
import { test } from '@playwright/test'

/**
 * Clear all data from authentication-related tables
 * Calls test-only server endpoint to clear database
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3000/test/database/clear', {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to clear database')
    }

    console.log('Database cleared successfully')
  } catch (error) {
    console.error('Failed to clear database:', error)
    throw error
  }
}

/**
 * Clear all data from authentication session table
 * Calls test-only server endpoint to clear database
 */
export const clearSessions = async (): Promise<void> => {
  try {
    const response = await fetch(
      'http://localhost:3000/test/database/clear-sessions',
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to clear sessions')
    }

    console.log('Database sessions cleared successfully')
  } catch (error) {
    console.error('Failed to clear sessions:', error)
    throw error
  }
}

/**
 * Seed database with test data
 * Calls test-only server endpoint to seed database
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    const response = await fetch('http://localhost:3000/test/database/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      error?: string
      usersCreated?: number
      accountsCreated?: number
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to seed database')
    }

    console.log(
      `Database seeded successfully: ${result.usersCreated} users, ${result.accountsCreated} accounts`
    )
  } catch (error) {
    console.error('Failed to seed database:', error)
    throw error
  }
}

/**
 * Wrapper type for Playwright test function
 */
type PlaywrightTestFunction = ({ page }: { page: any }) => Promise<void>

/**
 * Wrapper type for Playwright test function with mail server
 */
type PlaywrightTestFunctionWithEmail = ({ page, mailServer }: { page: any; mailServer: any }) => Promise<void>

/**
 * Enhanced test wrapper that provides database isolation
 * Clears and seeds database before each test, cleans up after
 */
export const testWithDatabase = (
  testFn: PlaywrightTestFunction
): PlaywrightTestFunction => {
  return async ({ page }) => {
    try {
      // Setup: Clear and seed database
      await clearDatabase()
      await seedDatabase()
      await clearSessions()

      // Run the test
      await testFn({ page })
    } finally {
      // Cleanup: Clear database after test
      await clearDatabase()
    }
  }
}

/**
 * Enhanced test wrapper that provides database isolation and smtp-tester
 * Clears and seeds database before each test, starts smtp server, cleans up after
 */
export const testWithDatabaseAndEmail = (
  testName: string,
  testFn: PlaywrightTestFunctionWithEmail
): void => {
  test(testName, async ({ page }) => {
    let mailServer: any = null
    
    try {
      // Setup: Start SMTP test server
      const { default: smtpTester } = await import('smtp-tester')
      mailServer = smtpTester.init(2500)
      
      // Setup: Clear and seed database
      await clearDatabase()
      await seedDatabase()
      await clearSessions()

      // Run the test with mail server support
      await testFn({ page, mailServer })
    } finally {
      // Cleanup: Stop mail server and clear database
      if (mailServer && typeof mailServer.stop === 'function') {
        mailServer.stop()
      }
      await clearDatabase()
    }
  })
}
