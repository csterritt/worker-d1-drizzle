/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Handle resend verification email requests
 * @module routes/auth/handleResendEmail
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { redirectWithMessage } from '../../lib/redirects'
import {
  PATHS,
  DURATIONS,
  COOKIES,
  STANDARD_SECURE_HEADERS,
} from '../../constants'
import { createAuth } from '../../lib/auth'
import type { Bindings } from '../../local-types'
import { createDbClient } from '../../db/client'
import {
  getUserWithAccountByEmail,
  updateAccountTimestamp,
} from '../../lib/db-access'
import { addCookie } from '../../lib/cookie-support'

/**
 * Handle resend verification email form submission
 * Uses better-auth's built-in verification system for proper token management
 * Includes server-side rate limiting using database updatedAt field for scalability
 */
export const handleResendEmail = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    PATHS.AUTH.RESEND_EMAIL,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
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
          const userWithAccountResult = await getUserWithAccountByEmail(
            db,
            email
          )

          if (userWithAccountResult.isErr) {
            console.error(
              'Database error getting user with account:',
              userWithAccountResult.error
            )
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              PATHS.AUTH.AWAIT_VERIFICATION,
              'A new verification email has been sent. Please check your inbox.'
            )
          }

          const userWithAccount = userWithAccountResult.value

          if (userWithAccount.length === 0) {
            // Don't reveal that user doesn't exist for security
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              PATHS.AUTH.AWAIT_VERIFICATION,
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
          const waitTimeMs = DURATIONS.EMAIL_RESEND_TIME_IN_MILLISECONDS

          if (timeSinceLastEmail < waitTimeMs) {
            const remainingSeconds = Math.ceil(
              (waitTimeMs - timeSinceLastEmail) / 1000
            )
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              PATHS.AUTH.AWAIT_VERIFICATION,
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
          const updateResult = await updateAccountTimestamp(db, userData.userId)

          if (updateResult.isErr) {
            console.error(
              'Database error updating account timestamp:',
              updateResult.error
            )
            // Don't fail the process if timestamp update fails
          }

          addCookie(c, COOKIES.EMAIL_ENTERED, email)

          return redirectWithMessage(
            c,
            PATHS.AUTH.AWAIT_VERIFICATION,
            'A new verification email has been sent. Please check your inbox.'
          )
        } catch (emailError) {
          console.error('Error in resend email process:', emailError)
          addCookie(c, COOKIES.EMAIL_ENTERED, email)
          return redirectWithMessage(
            c,
            PATHS.AUTH.AWAIT_VERIFICATION,
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
    }
  )
}
