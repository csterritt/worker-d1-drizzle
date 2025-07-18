import { Context } from 'hono'
import { deleteCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'

import { COOKIES, PATHS } from '../constants'
import { redirectWithError, redirectWithMessage } from '../lib/redirects'
import { Bindings, SignInSession } from '../local-types'
import { setupNoCacheHeaders } from '../lib/setup-no-cache-headers'
import { deleteSession } from '../lib/db-access'
import { getCurrentTime } from '../lib/time-access'

/**
 * Middleware to restrict access to signed-in users only.
 * If the user is not signed in, redirect to sign-in page with an error message.
 */
export const signedInAccess = createMiddleware<{ Bindings: Bindings }>(
  async (c: Context, next) => {
    if (c.env.Session.isNothing) {
      return redirectWithError(
        c,
        PATHS.AUTH.SIGN_IN,
        'You must sign in to visit that page'
      )
    }

    const maybeSession: SignInSession = c.env.Session.value
    if (!maybeSession.signedIn) {
      return redirectWithError(
        c,
        PATHS.AUTH.SIGN_IN,
        'You must sign in to visit that page'
      )
    }

    // Check if session has expired
    if (maybeSession.expiresAt < getCurrentTime(c)) {
      await deleteSession(c.env.PROJECT_DB, maybeSession.id.toString())
      deleteCookie(c, COOKIES.SESSION, { path: '/' })

      return redirectWithMessage(
        c,
        PATHS.HOME,
        'You must sign in to visit that page'
      )
    }

    setupNoCacheHeaders(c)

    await next()
  }
)
