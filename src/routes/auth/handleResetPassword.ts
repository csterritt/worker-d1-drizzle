/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for password reset requests.
 * @module routes/auth/handleResetPassword
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithMessage, redirectWithError } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'

/**
 * Attach the reset password handler to the app.
 * @param app - Hono app instance
 */
export const handleResetPassword = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.post(
    '/auth/reset-password',
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const formData = await c.req.formData()
        const token = formData.get('token') as string
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (!token) {
          return redirectWithError(
            c,
            PATHS.AUTH.FORGOT_PASSWORD,
            'Invalid reset token. Please request a new password reset link.'
          )
        }

        if (!password || !confirmPassword) {
          return redirectWithError(
            c,
            `${PATHS.AUTH.RESET_PASSWORD}?token=${token}`,
            'Please fill in all fields.'
          )
        }

        if (password !== confirmPassword) {
          return redirectWithError(
            c,
            `${PATHS.AUTH.RESET_PASSWORD}?token=${token}`,
            'Passwords do not match. Please try again.'
          )
        }

        if (password.length < 8) {
          return redirectWithError(
            c,
            `${PATHS.AUTH.RESET_PASSWORD}?token=${token}`,
            'Password must be at least 8 characters long.'
          )
        }

        // Use better-auth to reset the password
        const auth = createAuth(c.env)

        try {
          const result = await auth.api.resetPassword({
            body: {
              token,
              newPassword: password,
            },
          })

          console.log('Reset password API result:', result)

          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Your password has been successfully reset. You can now sign in with your new password.'
          )
        } catch (error) {
          console.error('Password reset error:', error)

          // Check if it's a token validation error
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as any).message
            if (
              errorMessage.includes('token') ||
              errorMessage.includes('expired') ||
              errorMessage.includes('invalid')
            ) {
              return redirectWithError(
                c,
                PATHS.AUTH.FORGOT_PASSWORD,
                'The reset link is invalid or has expired. Please request a new password reset link.'
              )
            }
          }

          return redirectWithError(
            c,
            `${PATHS.AUTH.RESET_PASSWORD}?token=${token}`,
            'An error occurred while resetting your password. Please try again.'
          )
        }
      } catch (error) {
        console.error('Reset password handler error:', error)
        return redirectWithError(
          c,
          PATHS.AUTH.FORGOT_PASSWORD,
          'An error occurred. Please try again.'
        )
      }
    }
  )
}
