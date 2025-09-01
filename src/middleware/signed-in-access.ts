/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Context } from 'hono'
import { createMiddleware } from 'hono/factory'

import { PATHS } from '../constants'
import { redirectWithError } from '../lib/redirects'
import { Bindings } from '../local-types'
import { setupNoCacheHeaders } from '../lib/setup-no-cache-headers'

/**
 * Middleware to restrict access to signed-in users only.
 * If the user is not signed in, redirect to sign-in page with an error message.
 * Updated for better-auth integration.
 */
export const signedInAccess = createMiddleware<{ Bindings: Bindings }>(
  async (c: Context, next) => {
    // Check if user is authenticated using better-auth session context
    const user = c.get('user')
    const session = c.get('session')

    if (!user || !session) {
      return redirectWithError(
        c,
        PATHS.AUTH.SIGN_IN,
        'You must sign in to visit that page'
      )
    }

    // Better-auth handles session expiration automatically
    // No need to manually check expiration

    setupNoCacheHeaders(c)
    await next()
  }
)
