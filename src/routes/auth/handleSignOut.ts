/**
 * Route handler for signing out (POST).
 * @module routes/auth/handleSignOut
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, COOKIES, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage } from '../../lib/redirects'
import { deleteSession } from '../../lib/db/auth-access'
import {
  addSimpleCookie,
  removeCookie,
  retrieveCookie,
} from '../../lib/cookie-support'

/**
 * Attach the sign out POST route to the app.
 * @param app - Hono app instance
 */
export const handleSignOut = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    PATHS.AUTH.SIGN_OUT,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      const sessionId: string = (
        retrieveCookie(c, COOKIES.SESSION) ?? ''
      ).trim()
      if (sessionId !== '') {
        await deleteSession(c.env.PROJECT_DB, sessionId)
      }

      removeCookie(c, COOKIES.SESSION)

      // Set sign-out message cookie
      addSimpleCookie(c, COOKIES.SIGN_OUT_MESSAGE, 'Signed out successfully.')

      return redirectWithMessage(c, PATHS.ROOT, '')
    }
  )
}
