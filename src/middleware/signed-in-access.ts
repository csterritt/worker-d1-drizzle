/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Context } from 'hono'
import { createMiddleware } from 'hono/factory'

import { COOKIES, PATHS } from '../constants'
import { redirectWithError, redirectWithMessage } from '../lib/redirects'
import { Bindings, SignInSession } from '../local-types'
import { setupNoCacheHeaders } from '../lib/setup-no-cache-headers'
import { deleteSession } from '../lib/db/auth-access'
import { getCurrentTime } from '../lib/time-access'
import { removeCookie } from '../lib/cookie-support'

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
    if (maybeSession.expiresAt < getCurrentTime(c).getTime()) {
      await deleteSession(c.env.PROJECT_DB, maybeSession.id.toString())
      removeCookie(c, COOKIES.SESSION)

      return redirectWithMessage(
        c,
        PATHS.AUTH.SIGN_IN,
        'You must sign in to visit that page'
      )
    }

    setupNoCacheHeaders(c)

    await next()
  }
)
