/**
 * Route handler for cancelling the sign-in process.
 * @module routes/auth/handleCancelSignIn
 */
import { Hono } from 'hono'

import { PATHS, COOKIES } from '../../constants'
import { Bindings } from '../../local-types'
import { removeCookie, retrieveCookie } from '../../lib/cookie-support'
import { redirectWithMessage } from '../../lib/redirects'
import { deleteSession } from '../../lib/db/auth-access'

/**
 * Attach the cancel sign-in POST route to the app.
 * @param app - Hono app instance
 */
export const handleCancelSignIn = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(PATHS.AUTH.CANCEL_OTP, async (c) => {
    const sessionId: string = (retrieveCookie(c, COOKIES.SESSION) ?? '').trim()
    if (sessionId !== '') {
      await deleteSession(c.env.PROJECT_DB, sessionId)
    }

    removeCookie(c, COOKIES.EMAIL_ENTERED)
    removeCookie(c, COOKIES.ERROR_FOUND)
    removeCookie(c, COOKIES.SESSION)

    return redirectWithMessage(c, PATHS.ROOT, 'Sign in canceled.')
  })
}
