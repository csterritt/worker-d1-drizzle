import { Hono } from 'hono'
import { createDbClient } from '../../db/client'
import { user, account, session } from '../../db/schema'
import { createAuth } from '../../lib/auth'

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

    return c.json({
      success: true,
      message: 'Database cleared successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to clear test database:', error)

    return c.json(
      {
        success: false,
        error: 'Failed to clear database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
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
          'a3e63ca349cf8bfc3dbef02636b8810d:1bbfadec89e1ee2c3fd1d49676b3298acec5921695264a2d55082cb387a3180adab4ff91033e146cd0e9ce3709a39e665d32de93a7c0294937df300e2720f405',
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

/**
 * Generate password hash using better-auth's password utilities
 * POST /test/database/hash-password
 */
testDatabaseRouter.post('/hash-password', async (c) => {
  try {
    const body = await c.req.json()
    const { password } = body

    if (!password) {
      return c.json({ success: false, error: 'Password is required' }, 400)
    }

    try {
      // Try to import better-auth's password utilities directly
      const { hash } = await import('better-auth/utils/password')

      const passwordHash = await hash(password)

      return c.json({
        success: true,
        password: password,
        hash: passwordHash,
        message: 'Password hash generated using better-auth password utilities',
      })
    } catch (importError) {
      // If direct import fails, try alternative approach
      console.log(
        'Direct import failed, trying alternative approach:',
        importError
      )

      try {
        // Import bcrypt which better-auth likely uses internally
        const bcrypt = await import('bcryptjs')
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        return c.json({
          success: true,
          password: password,
          hash: passwordHash,
          message:
            'Password hash generated using bcrypt (better-auth compatible)',
        })
      } catch (bcryptError) {
        return c.json(
          {
            success: false,
            error:
              'Failed to hash password with both better-auth utils and bcrypt',
            details: {
              importError:
                importError instanceof Error
                  ? importError.message
                  : 'Unknown import error',
              bcryptError:
                bcryptError instanceof Error
                  ? bcryptError.message
                  : 'Unknown bcrypt error',
            },
          },
          500
        )
      }
    }
  } catch (error) {
    console.error('Failed to hash password:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to hash password',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Debug: Get password hash for a user
 * GET /test/database/get-hash/:email
 */
testDatabaseRouter.get('/get-hash/:email', async (c) => {
  try {
    const email = c.req.param('email')
    const db = createDbClient(c.env.PROJECT_DB)

    const { eq } = await import('drizzle-orm')

    // Find user by email
    const foundUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    if (foundUser.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }

    // Find account for that user
    const foundAccount = await db
      .select()
      .from(account)
      .where(eq(account.userId, foundUser[0].id))
      .limit(1)

    if (foundAccount.length === 0) {
      return c.json({ success: false, error: 'Account not found' }, 404)
    }

    return c.json({
      success: true,
      email: email,
      userId: foundUser[0].id,
      password: foundAccount[0].password,
      message: 'Password hash retrieved successfully',
    })
  } catch (error) {
    console.error('Failed to get password hash:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to get password hash',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * Debug: List all users and their password hashes
 * GET /test/database/list-users
 */
testDatabaseRouter.get('/list-users', async (c) => {
  try {
    const db = createDbClient(c.env.PROJECT_DB)

    // Get all users
    const allUsers = await db.select().from(user)

    // Get all accounts
    const allAccounts = await db.select().from(account)

    // Combine user and account data
    const usersWithAccounts = allUsers.map((u) => {
      const userAccount = allAccounts.find((a) => a.userId === u.id)
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        password: userAccount?.password || 'No account found',
      }
    })

    return c.json({
      success: true,
      users: usersWithAccounts,
      counts: {
        users: allUsers.length,
        accounts: allAccounts.length,
      },
    })
  } catch (error) {
    console.error('Failed to list users:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to list users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export { testDatabaseRouter }
