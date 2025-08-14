/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Handle resend verification email requests
 * @module routes/auth/handleResendEmail
 */
import { Hono } from 'hono'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS, DURATIONS } from '../../constants'
import { createAuth } from '../../lib/auth'
import type { Bindings } from '../../local-types'
import { eq } from 'drizzle-orm'
import { user, account } from '../../db/schema'
import { createDbClient } from '../../db/client'

/**
 * Handle resend verification email form submission
 * Uses better-auth's built-in verification system for proper token management
 * Includes server-side rate limiting using database updatedAt field for scalability
 */
export const handleResendEmail = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(PATHS.AUTH.RESEND_EMAIL, async (c) => {
    try {
      const formData = await c.req.formData()
      const email = formData.get('email') as string

      // Validate email is provided
      if (!email) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.AWAIT_VERIFICATION,
          'Email address is required to resend verification.'
        )
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.AWAIT_VERIFICATION,
          'Please enter a valid email address.'
        )
      }

      try {
        // Create database client and auth instance
        const db = createDbClient(c.env.PROJECT_DB)
        const auth = createAuth(c.env)

        // Check if user exists and get their verification status along with account info for rate limiting
        const userWithAccount = await db
          .select({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            emailVerified: user.emailVerified,
            accountUpdatedAt: account.updatedAt,
          })
          .from(user)
          .leftJoin(account, eq(account.userId, user.id))
          .where(eq(user.email, email))
          .limit(1)

        if (userWithAccount.length === 0) {
          // Don't reveal that user doesn't exist for security
          return redirectWithMessage(
            c,
            `${PATHS.AUTH.AWAIT_VERIFICATION}?email=${encodeURIComponent(email)}`,
            'A new verification email has been sent. Please check your inbox.'
          )
        }

        const userData = userWithAccount[0]

        // Check if user is already verified
        if (userData.emailVerified) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Your email is already verified. You can sign in now.'
          )
        }

        // Check rate limiting using account.updatedAt
        const now = Date.now()
        const lastEmailTime = userData.accountUpdatedAt
          ? userData.accountUpdatedAt.getTime()
          : 0
        const timeSinceLastEmail = now - lastEmailTime
        const waitTimeMs = DURATIONS.THIRTY_SECONDS_IN_MILLISECONDS

        if (timeSinceLastEmail < waitTimeMs) {
          const remainingSeconds = Math.ceil(
            (waitTimeMs - timeSinceLastEmail) / 1000
          )
          return redirectWithMessage(
            c,
            `${PATHS.AUTH.AWAIT_VERIFICATION}?email=${encodeURIComponent(email)}`,
            `Please wait ${remainingSeconds} more second${remainingSeconds !== 1 ? 's' : ''} before requesting another verification email.`
          )
        }

        // Use better-auth's built-in sendVerificationEmail method
        // This ensures proper token generation and management
        await auth.api.sendVerificationEmail({
          body: {
            email: email,
            callbackURL: `${c.req.url.split('/')[0]}//${c.req.url.split('/')[2]}${PATHS.AUTH.SIGN_IN}`,
          },
        })

        // Update the account's updatedAt field to track this email send
        await db
          .update(account)
          .set({ updatedAt: new Date() })
          .where(eq(account.userId, userData.userId))

        return redirectWithMessage(
          c,
          `${PATHS.AUTH.AWAIT_VERIFICATION}?email=${encodeURIComponent(email)}`,
          'A new verification email has been sent. Please check your inbox.'
        )
      } catch (emailError) {
        console.error('Error in resend email process:', emailError)
        return redirectWithMessage(
          c,
          `${PATHS.AUTH.AWAIT_VERIFICATION}?email=${encodeURIComponent(email)}`,
          'A new verification email has been sent. Please check your inbox.'
        )
      }
    } catch (error) {
      console.error('Resend email error:', error)
      return redirectWithMessage(
        c,
        PATHS.AUTH.AWAIT_VERIFICATION,
        'Something went wrong. Please try again.'
      )
    }
  })
}
