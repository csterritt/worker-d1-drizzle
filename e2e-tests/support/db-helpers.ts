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
 * Check if a single-use code exists in the database
 * @param code - The code to check
 * @returns Promise<boolean> - true if code exists, false otherwise
 */
export const checkCodeExists = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `http://localhost:3000/test/database/code-exists/${encodeURIComponent(code)}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = (await response.json()) as {
      success: boolean
      exists: boolean
      error?: string
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to check code existence')
    }

    return result.exists
  } catch (error) {
    console.error('Failed to check code existence:', error)
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
      singleUseCodesCreated?: number
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to seed database')
    }

    console.log(
      `Database seeded successfully: ${result.usersCreated} users, ${result.accountsCreated} accounts, ${result.singleUseCodesCreated} codes`
    )
  } catch (error) {
    console.error('Failed to seed database:', error)
    throw error
  }
}
