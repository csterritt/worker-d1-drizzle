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
import { user } from '../../db/schema'
import { createDbClient } from '../../db/client'

// In-memory store for tracking last resend times by email
// In production, this could be moved to a database table or cache
// Exported so other handlers can track initial email send times
export const lastResendTimes = new Map<string, number>()

/**
 * Handle resend verification email form submission
 * Uses better-auth's built-in verification system for proper token management
 * Includes server-side rate limiting to prevent abuse
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

      // Check rate limiting
      const now = Date.now()
      const lastResendTime = lastResendTimes.get(email) || 0
      const timeSinceLastResend = now - lastResendTime
      const waitTimeMs = DURATIONS.THIRTY_SECONDS_IN_MILLISECONDS

      if (timeSinceLastResend < waitTimeMs) {
        const remainingSeconds = Math.ceil((waitTimeMs - timeSinceLastResend) / 1000)
        return redirectWithMessage(
          c,
          `${PATHS.AUTH.AWAIT_VERIFICATION}?email=${encodeURIComponent(email)}`,
          `Please wait ${remainingSeconds} more second${remainingSeconds !== 1 ? 's' : ''} before requesting another verification email.`
        )
      }

      try {
        // Create database client and auth instance
        const db = createDbClient(c.env.PROJECT_DB)
        const auth = createAuth(c.env)

        // Check if user exists and get their verification status
        const userData = await db
          .select()
          .from(user)
          .where(eq(user.email, email))
          .limit(1)

        if (userData.length === 0) {
          // Don't reveal that user doesn't exist for security
          // But still update the rate limit to prevent enumeration attacks
          lastResendTimes.set(email, now)
          return redirectWithMessage(
            c,
            `${PATHS.AUTH.AWAIT_VERIFICATION}?email=${encodeURIComponent(email)}`,
            'A new verification email has been sent. Please check your inbox.'
          )
        }

        const userRecord = userData[0]

        // Check if user is already verified
        if (userRecord.emailVerified) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Your email is already verified. You can sign in now.'
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

        // Update the last resend time after successful send
        lastResendTimes.set(email, now)

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
