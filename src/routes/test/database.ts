import { Hono } from 'hono'
import { createDbClient } from '../../db/client'
import { user, account, session } from '../../db/schema'

/**
 * Test-only database manipulation endpoints
 * These endpoints should ONLY be available in development/test environments
 */

const testDatabaseRouter = new Hono<{ Bindings: { PROJECT_DB: D1Database } }>()

/**
 * Clear all authentication data from the database
 * DELETE /test/database/clear
 */
testDatabaseRouter.delete('/clear', async (c) => {
  try {
    const db = createDbClient(c.env.PROJECT_DB)

    // Delete in order to avoid foreign key constraints
    await db.delete(session)
    await db.delete(account)
    await db.delete(user)

    console.log('Test database cleared successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database cleared successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Failed to clear test database:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error clearing test database',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * Clear all authentication data from the database
 * DELETE /test/database/clear
 */
testDatabaseRouter.delete('/clear-sessions', async (c) => {
  try {
    const db = createDbClient(c.env.PROJECT_DB)

    // Delete in order to avoid foreign key constraints
    await db.delete(session)

    console.log('Test database sessions cleared successfully')

    return c.json({
      success: true,
      message: 'Database sessions cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to clear test database sessions:', error)

    return c.json(
      {
        success: false,
        error: 'Failed to clear database sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Seed the database with test data
 * POST /test/database/seed
 */
testDatabaseRouter.post('/seed', async (c) => {
  try {
    const db = createDbClient(c.env.PROJECT_DB)

    // Insert test users
    const testUsers = [
      {
        id: 'gv9HBfkV7WbSSAkgVW0g5WtYf6hqaJyv',
        name: 'Chris',
        email: 'csterritt@gmail.com',
        emailVerified: true,
        image: null,
        createdAt: new Date(1754691970 * 1000),
        updatedAt: new Date(1754691970 * 1000),
      },
      {
        id: 'On2TgJxPrsP7McTAkYLxoEwsKSpTUldF',
        name: 'FredF',
        email: 'fredfred@team439980.testinator.com',
        emailVerified: true,
        image: null,
        createdAt: new Date(1754692362 * 1000),
        updatedAt: new Date(1754692362 * 1000),
      },
    ]

    for (const userData of testUsers) {
      await db.insert(user).values(userData)
    }

    // Insert test accounts with credentials
    const testAccounts = [
      {
        id: 'u95mdScYyupHDIAF76793YXkI8mDBxwf',
        userId: 'gv9HBfkV7WbSSAkgVW0g5WtYf6hqaJyv',
        accountId: 'gv9HBfkV7WbSSAkgVW0g5WtYf6hqaJyv',
        providerId: 'credential',
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        idToken: null,
        password:
          '9461538c8ed05944c1ff4744050320ec:7f25e93a4c138ce0dc5a0be87ca63ecdb2eb242d64a9270cb1c727114a2d55577b84d246c4b8e35cf804603df9917b854cbb61aec94cc3c7e6f29fb3502704d6',
        createdAt: new Date(1754691970 * 1000),
        updatedAt: new Date(1754691970 * 1000),
      },
      {
        id: 'HCRWSgAh2CAvHzT9JzvmJ1NVk2OQa75K',
        userId: 'On2TgJxPrsP7McTAkYLxoEwsKSpTUldF',
        accountId: 'On2TgJxPrsP7McTAkYLxoEwsKSpTUldF',
        providerId: 'credential',
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        idToken: null,
        password:
          '7e5d7c0ecefe406431c83511212f4432:81ee5ebdd4123c3d78037185ace585897b9c3465f33f7a9f3f8bec31b919f373054b861ba18f3c6952609abb71cd870e2d2a8f3f14566e910d4d5bf0ac5ba6d5',
        createdAt: new Date(1754692362 * 1000),
        updatedAt: new Date(1754692362 * 1000),
      },
    ]

    for (const accountData of testAccounts) {
      await db.insert(account).values(accountData)
    }

    console.log('Test database seeded successfully')

    return c.json({
      success: true,
      message: 'Database seeded successfully',
      usersCreated: testUsers.length,
      accountsCreated: testAccounts.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to seed test database:', error)

    return c.json(
      {
        success: false,
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Get database status for debugging
 * GET /test/database/status
 */
testDatabaseRouter.get('/status', async (c) => {
  try {
    const db = createDbClient(c.env.PROJECT_DB)

    // Count records in each table
    const userCount = await db.select().from(user)
    const accountCount = await db.select().from(account)
    const sessionCount = await db.select().from(session)

    return c.json({
      success: true,
      counts: {
        users: userCount.length,
        accounts: accountCount.length,
        sessions: sessionCount.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to get database status:', error)

    return c.json(
      {
        success: false,
        error: 'Failed to get database status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export { testDatabaseRouter }
