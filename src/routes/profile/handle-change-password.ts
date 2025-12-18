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
import type { AuthUser, Bindings } from '../../local-types'
import { signedInAccess } from '../../middleware/signed-in-access'
import { validateRequest, ChangePasswordFormSchema } from '../../lib/validators'

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  userInfo?: string
}

const isErrorWithMessage = (value: unknown): value is { message: string } => {
  if (typeof value !== 'object' || value === null) return false
  if (!('message' in value)) return false
  return typeof (value as { message: unknown }).message === 'string'
}

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
    signedInAccess,
    async (c: Context) => {
      try {
        const user = c.get('user') as AuthUser

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

        const { currentPassword, newPassword } = data as ChangePasswordData

        // Use better-auth to change the password
        const auth = createAuth(c.env)

        try {
          // Use better-auth's changePassword method
          // This requires the session headers to authenticate the request
          await auth.api.changePassword({
            body: {
              currentPassword,
              newPassword,
              revokeOtherSessions: true,
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
          if (isErrorWithMessage(error)) {
            const errorMessage = error.message
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
