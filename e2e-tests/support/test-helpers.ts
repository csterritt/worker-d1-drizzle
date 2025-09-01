import { clearDatabase, clearSessions, seedDatabase } from './db-helpers'

/**
 * Wrapper type for Playwright test function
 */
type PlaywrightTestFunction = ({
  page,
  request,
}: {
  page: any
  request: any
}) => Promise<void>
/**
 * Enhanced test wrapper that provides database isolation
 * Clears and seeds database before each test, cleans up after
 */
export const testWithDatabase = (
  testFn: PlaywrightTestFunction
): PlaywrightTestFunction => {
  return async ({ page, request }) => {
    try {
      // Setup: Clear and seed database
      await clearDatabase()
      await seedDatabase()
      await clearSessions()

      // Run the test
      await testFn({ page, request })
    } finally {
      // Cleanup: Clear database after test
      await clearDatabase()
    }
  }
}
