/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { createMiddleware } from 'hono/factory'
import { Maybe } from 'true-myth'

import { COOKIES } from '../constants'
import { findSessionById } from '../lib/db/auth-access'
import { isErr } from 'true-myth/result'
import type { Bindings } from '../local-types'
import { retrieveCookie } from '../lib/cookie-support'

/**
 * Middleware to provide session data to the request.
 * If the user is not signed in, set session to nothing.
 */
export const provideSession = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const sessionId = retrieveCookie(c, COOKIES.SESSION)
    if (!sessionId) {
      c.env.Session = Maybe.nothing()
    } else {
      const sessionResult = await findSessionById(c.env.PROJECT_DB, sessionId)
      if (isErr(sessionResult)) {
        console.error('Error finding session:', sessionResult.error)
        c.env.Session = Maybe.nothing()
      } else {
        c.env.Session = sessionResult.value
      }
    }

    await next()
  }
)
