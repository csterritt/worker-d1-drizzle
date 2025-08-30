/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for forgot password requests.
 * @module routes/auth/handleForgotPassword
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import {
  PATHS,
  COOKIES,
  STANDARD_SECURE_HEADERS,
  DURATIONS,
} from '../../constants'
import { addCookie } from '../../lib/cookie-support'
import { Bindings } from '../../local-types'
import { createDbClient } from '../../db/client'
import {
  getUserWithAccountByEmail,
  updateAccountTimestamp,
} from '../../lib/db-access'

/**
 * Attach the forgot password handler to the app.
 * @param app - Hono app instance
 */
export const handleForgotPassword = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.post(
    '/auth/forgot-password',
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const formData = await c.req.formData()
        const email = formData.get('email') as string

        if (!email) {
          return redirectWithError(
            c,
            PATHS.AUTH.FORGOT_PASSWORD,
            'Please enter your email address.'
          )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return redirectWithError(
            c,
            PATHS.AUTH.FORGOT_PASSWORD,
            'Please enter a valid email address.'
          )
        }

        try {
          // Create database client and auth instance
          const db = createDbClient(c.env.PROJECT_DB)
          const auth = createAuth(c.env)

          // Check if user exists and get their account info for rate limiting
          const userWithAccountResult = await getUserWithAccountByEmail(
            db,
            email
          )

          if (userWithAccountResult.isErr) {
            console.error(
              'Database error getting user with account:',
              userWithAccountResult.error
            )
            // Store email in cookie for the waiting page
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              PATHS.AUTH.WAITING_FOR_RESET,
              "If an account with that email exists, we've sent you a password reset link."
            )
          }

          const userWithAccount = userWithAccountResult.value

          if (userWithAccount.length === 0) {
            // Don't reveal that user doesn't exist for security
            // But still apply rate limiting by using a generic approach
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              PATHS.AUTH.WAITING_FOR_RESET,
              "If an account with that email exists, we've sent you a password reset link."
            )
          }

          const userData = userWithAccount[0]

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
            return redirectWithError(
              c,
              PATHS.AUTH.FORGOT_PASSWORD,
              `Please wait ${remainingSeconds} more second${remainingSeconds !== 1 ? 's' : ''} before requesting another password reset email.`
            )
          }

          // Use better-auth to send password reset email
          try {
            const result = await auth.api.forgetPassword({
              body: {
                email,
                redirectTo: `${new URL(c.req.url).origin}${PATHS.AUTH.RESET_PASSWORD}`,
              },
            })

            console.log('Password reset API result:', result)

            // Update the account's updatedAt field to track this email send
            const updateResult = await updateAccountTimestamp(
              db,
              userData.userId
            )

            if (updateResult.isErr) {
              console.error(
                'Database error updating account timestamp:',
                updateResult.error
              )
              // Don't fail the process if timestamp update fails
            }

            // Store email in cookie for the waiting page
            addCookie(c, COOKIES.EMAIL_ENTERED, email)

            // Always redirect to waiting page, regardless of whether email exists
            // This prevents email enumeration attacks
            return redirectWithMessage(
              c,
              PATHS.AUTH.WAITING_FOR_RESET,
              "If an account with that email exists, we've sent you a password reset link."
            )
          } catch (emailError) {
            console.error('Password reset email error:', emailError)

            // Store email in cookie for the waiting page
            addCookie(c, COOKIES.EMAIL_ENTERED, email)

            // Still redirect to waiting page to prevent email enumeration
            return redirectWithMessage(
              c,
              PATHS.AUTH.WAITING_FOR_RESET,
              "If an account with that email exists, we've sent you a password reset link."
            )
          }
        } catch (error) {
          console.error('Password reset process error:', error)

          // Store email in cookie for the waiting page
          addCookie(c, COOKIES.EMAIL_ENTERED, email)

          // Still redirect to waiting page to prevent email enumeration
          return redirectWithMessage(
            c,
            PATHS.AUTH.WAITING_FOR_RESET,
            "If an account with that email exists, we've sent you a password reset link."
          )
        }
      } catch (error) {
        console.error('Forgot password handler error:', error)
        return redirectWithError(
          c,
          PATHS.AUTH.FORGOT_PASSWORD,
          'An error occurred. Please try again.'
        )
      }
    }
  )
}
