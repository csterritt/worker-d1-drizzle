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
import { PATHS, COOKIES, STANDARD_SECURE_HEADERS } from '../../constants'
import { addCookie } from '../../lib/cookie-support'
import { Bindings } from '../../local-types'

/**
 * Attach the forgot password handler to the app.
 * @param app - Hono app instance
 */
export const handleForgotPassword = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.post('/auth/forgot-password', secureHeaders(STANDARD_SECURE_HEADERS), async (c) => {
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

      // Use better-auth to send password reset email
      const auth = createAuth(c.env)

      try {
        const result = await auth.api.forgetPassword({
          body: {
            email,
            redirectTo: `${new URL(c.req.url).origin}${PATHS.AUTH.RESET_PASSWORD}`,
          },
        })
        
        console.log('Password reset API result:', result)

        // Store email in cookie for the waiting page
        addCookie(c, COOKIES.EMAIL_ENTERED, email)

        // Always redirect to waiting page, regardless of whether email exists
        // This prevents email enumeration attacks
        return redirectWithMessage(
          c,
          PATHS.AUTH.WAITING_FOR_RESET,
          "If an account with that email exists, we've sent you a password reset link."
        )
      } catch (error) {
        console.error('Password reset error:', error)

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
  })
}
