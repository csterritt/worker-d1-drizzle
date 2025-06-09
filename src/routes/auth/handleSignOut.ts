/**
 * Route handler for signing out (POST).
 * @module routes/auth/handleSignOut
 */
import { Hono } from 'hono'
import { getCookie, deleteCookie } from 'hono/cookie'
import { PATHS, COOKIES, HTML_STATUS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage } from '../../lib/redirects'
import { deleteSession } from '../../lib/db-access'

/**
 * Attach the sign out POST route to the app.
 * @param app - Hono app instance
 */
export const handleSignOut = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(PATHS.AUTH.SIGN_OUT, async (c) => {
    const sessionId: string = (getCookie(c, COOKIES.SESSION) ?? '').trim()
    if (sessionId !== '') {
      await deleteSession(c.env.PROJECT_DB, sessionId)
    }

    deleteCookie(c, COOKIES.SESSION, { path: '/' })

    return redirectWithMessage(c, PATHS.HOME, 'Signed out successfully.')
  })
}
