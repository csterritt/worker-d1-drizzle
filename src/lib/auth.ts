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
import { sendConfirmationEmail, sendPasswordResetEmail } from './email-service'
import type { Bindings } from '../local-types'
import { DURATIONS } from '../constants'

/**
 * Create and configure better-auth instance
 * @param env - Cloudflare environment
 * @returns Configured better-auth instance
 */
export const createAuth = (env: Bindings) => {
  const db: D1Database = env.PROJECT_DB
  const dbClient = createDbClient(db)

  let alternateOrigin = 'http://localhost:3000/' // PRODUCTION:REMOVE
  // PRODUCTION:REMOVE-NEXT-LINE
  if (env.ALTERNATE_ORIGIN) {
    alternateOrigin = env.ALTERNATE_ORIGIN.replace(/\$/, '') // PRODUCTION:REMOVE
  } // PRODUCTION:REMOVE

  return betterAuth({
    database: drizzleAdapter(dbClient, {
      provider: 'sqlite',
      schema: {
        ...schema,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // Enable email verification for sign-ups
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({
        user,
        url,
        token,
      }: {
        user: { email: string; name: string }
        url: string
        token: string
      }) => {
        console.log('🔔 better-auth sendResetPassword triggered:', {
          user: user.email,
          url,
          token,
        })
        try {
          // Send password reset email using our email service
          await sendPasswordResetEmail(env, user.email, user.name, url, token)
          console.log('✅ Password reset email sent successfully')
        } catch (error) {
          console.error('❌ Error in sendResetPassword:', error)
          throw error
        }
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({
        user,
        url,
        token,
      }: {
        user: { email: string; name: string }
        url: string
        token: string
      }) => {
        console.log('🔔 better-auth sendVerificationEmail triggered:', {
          user: user.email,
          url,
          token,
        })
        try {
          // Send confirmation email using our email service
          await sendConfirmationEmail(env, user.email, user.name, url, token)
          console.log('✅ Email sent successfully via sendConfirmationEmail')
        } catch (error) {
          console.error('❌ Error in sendVerificationEmail:', error)
          throw error
        }
      },
    },
    session: {
      expiresIn: DURATIONS.THIRTY_DAYS_IN_SECONDS, // 30 days
      updateAge: DURATIONS.ONE_DAY_IN_SECONDS, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: DURATIONS.FIVE_MINUTES_IN_SECONDS, // 5 minutes
      },
    },
    // Using better-auth's default ID generation
    // advanced: {
    //   database: {
    //     generateId: // use default
    //   },
    // },
    trustedOrigins: [
      'http://localhost:3000', // PRODUCTION:REMOVE
      'http://127.0.0.1:3000', // PRODUCTION:REMOVE
      alternateOrigin, // PRODUCTION:REMOVE
      // 'https://your-actual-origin.com', 'https://your-url.your-group.workers.dev' // PRODUCTION:UNCOMMENT
    ],
    // baseURL: 'https://your-actual-origin.com', // PRODUCTION:UNCOMMENT
    baseURL: 'http://localhost:3000', // PRODUCTION:REMOVE
    redirectTo: '/private', // Redirect to protected page after successful sign-in
    secret: env.BETTER_AUTH_SECRET,
  })
}

export type Auth = ReturnType<typeof createAuth>
