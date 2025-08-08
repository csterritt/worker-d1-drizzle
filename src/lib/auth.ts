/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Better Auth configuration and setup
 * @module lib/auth
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createDbClient } from '../db/client'
import { schema } from '../db/schema'

/**
 * Create and configure better-auth instance
 * @param db - D1Database instance from Cloudflare environment
 * @returns Configured better-auth instance
 */
export function createAuth(db: D1Database) {
  const dbClient = createDbClient(db)
  
  return betterAuth({
    database: drizzleAdapter(dbClient, {
      provider: 'sqlite',
      schema: {
        ...schema,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // We'll start simple, can enable later
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    // Using better-auth's default ID generation
    // advanced: {
    //   database: {
    //     generateId: // use default
    //   },
    // },
    trustedOrigins: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      // Add production origins as needed
    ],
    secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-change-this-in-production',
  })
}

export type Auth = ReturnType<typeof createAuth>
