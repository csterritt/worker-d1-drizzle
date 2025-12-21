/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for account deletion requests from profile page.
 * @module routes/profile/handleDeleteAccount
 */
import { Context, Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { redirectWithMessage, redirectWithError } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import type { AuthUser, Bindings, DrizzleClient } from '../../local-types'
import { signedInAccess } from '../../middleware/signed-in-access'
import { deleteUserAccount } from '../../lib/db-access'

/**
 * Attach the delete account handler to the app.
 * @param app - Hono app instance
 */
export const handleDeleteAccount = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.post(
    PATHS.PROFILE_DELETE,
    secureHeaders(STANDARD_SECURE_HEADERS),
    signedInAccess,
    async (c: Context) => {
      try {
        const user = c.get('user') as AuthUser
        const db = c.get('db') as DrizzleClient

        if (!user || !user.id) {
          console.error('Delete account: No user found in session')
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_IN,
            'Please sign in to delete your account.'
          )
        }

        const userId = user.id
        console.log('Deleting account for user:', user.email)

        const result = await deleteUserAccount(db, userId)

        if (result.isErr) {
          console.error('Delete account error:', result.error)
          return redirectWithError(
            c,
            PATHS.PROFILE,
            'An error occurred while deleting your account. Please try again.'
          )
        }

        if (!result.value) {
          console.error('Delete account: User not found in database')
          return redirectWithError(
            c,
            PATHS.PROFILE,
            'Unable to delete account. Please try again.'
          )
        }

        console.log('Account deleted successfully for user:', user.email)

        // Clear session cookies and redirect to sign-in with success message
        const response = redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'Your account has been successfully deleted.'
        )

        // Clear better-auth session cookies
        response.headers.append(
          'Set-Cookie',
          'better-auth.session_token=; Path=/; HttpOnly; SameSite=lax; Max-Age=0'
        )
        response.headers.append(
          'Set-Cookie',
          'better-auth.session_data=; Path=/; HttpOnly; SameSite=lax; Max-Age=0'
        )

        return response
      } catch (error) {
        console.error('Delete account handler error:', error)
        return redirectWithError(
          c,
          PATHS.PROFILE,
          'An error occurred. Please try again.'
        )
      }
    }
  )
}
