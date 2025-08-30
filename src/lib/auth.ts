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

/**
 * Create and configure better-auth instance
 * @param env - Cloudflare environment
 * @returns Configured better-auth instance
 */
export const createAuth = (env: any) => {
  const db: D1Database = env.PROJECT_DB
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
    baseURL: 'http://localhost:3000',
    redirectTo: '/private', // Redirect to protected page after successful sign-in
    secret:
      process.env.BETTER_AUTH_SECRET ||
      'your-secret-key-change-this-in-production',
  })
}

export type Auth = ReturnType<typeof createAuth>
