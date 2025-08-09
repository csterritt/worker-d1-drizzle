/**
 * Database helpers for e2e tests
 * Provides functions to clear and seed test database via server endpoints
 */

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

      // Run the actual test
      await testFn({ page })
    } catch (error) {
      console.error('Test failed:', error)
      throw error
    } finally {
      // Cleanup: Clear database
      try {
        await clearSessions()
      } catch (cleanupError) {
        console.error('Test cleanup failed:', cleanupError)
      }
    }
  }
}
