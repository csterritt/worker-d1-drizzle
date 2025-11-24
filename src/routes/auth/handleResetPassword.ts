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
import { MESSAGES, PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { validateRequest, ResetPasswordFormSchema } from '../../lib/validators'

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
        const body = await c.req.parseBody()
        let [ok, data, err] = validateRequest(body, ResetPasswordFormSchema)
        if (!ok) {
          const commaSpot = err?.indexOf(',') ?? -1
          if (commaSpot > -1) {
            err = err?.substring(0, commaSpot) || 'Invalid input'
          }

          const tokenEntered = (body as any)?.token as string | undefined
          const target = tokenEntered
            ? `${PATHS.AUTH.RESET_PASSWORD}?token=${tokenEntered}`
            : PATHS.AUTH.FORGOT_PASSWORD
          return redirectWithError(c, target, err || MESSAGES.INVALID_INPUT)
        }

        const { token, password } = data as any

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
