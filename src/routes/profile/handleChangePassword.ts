/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for password change requests from profile page.
 * @module routes/profile/handleChangePassword
 */
import { Context, Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithMessage, redirectWithError } from '../../lib/redirects'
import { MESSAGES, PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { validateRequest, ChangePasswordFormSchema } from '../../lib/validators'

/**
 * Attach the change password handler to the app.
 * @param app - Hono app instance
 */
export const handleChangePassword = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.post(
    PATHS.PROFILE,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c: Context) => {
      try {
        const user = c.get('user')

        // Redirect to sign-in if not authenticated
        if (!user) {
          return c.redirect(PATHS.AUTH.SIGN_IN)
        }

        const body = await c.req.parseBody()
        let [ok, data, err] = validateRequest(body, ChangePasswordFormSchema)

        if (!ok) {
          const commaSpot = err?.indexOf(',') ?? -1
          if (commaSpot > -1) {
            err = err?.substring(0, commaSpot) || 'Invalid input'
          }
          return redirectWithError(
            c,
            PATHS.PROFILE,
            err || MESSAGES.INVALID_INPUT
          )
        }

        const { currentPassword, newPassword } = data as any

        // Use better-auth to change the password
        const auth = createAuth(c.env)

        try {
          // Use better-auth's changePassword method
          // This requires the session headers to authenticate the request
          await auth.api.changePassword({
            body: {
              currentPassword,
              newPassword,
              revokeOtherSessions: false,
            },
            headers: c.req.raw.headers,
          })

          console.log('Password changed successfully for user:', user.email)

          return redirectWithMessage(
            c,
            PATHS.PROFILE,
            'Your password has been successfully changed.'
          )
        } catch (error) {
          console.error('Password change error:', error)

          // Check if it's a current password verification error
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as any).message
            if (
              errorMessage.includes('password') ||
              errorMessage.includes('incorrect') ||
              errorMessage.includes('invalid')
            ) {
              return redirectWithError(
                c,
                PATHS.PROFILE,
                'Current password is incorrect. Please try again.'
              )
            }
          }

          return redirectWithError(
            c,
            PATHS.PROFILE,
            'An error occurred while changing your password. Please try again.'
          )
        }
      } catch (error) {
        console.error('Change password handler error:', error)
        return redirectWithError(
          c,
          PATHS.PROFILE,
          'An error occurred. Please try again.'
        )
      }
    }
  )
}
