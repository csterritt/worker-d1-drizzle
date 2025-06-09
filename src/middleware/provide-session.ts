import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { Maybe } from 'true-myth'

import { COOKIES } from '../constants'
import { findSessionById } from '../lib/db-access'
import { isErr } from 'true-myth/result'
import type { Bindings } from '../local-types'

/**
 * Middleware to provide session data to the request.
 * If the user is not signed in, set session to nothing.
 */
export const provideSession = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const sessionId = getCookie(c, COOKIES.SESSION)
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
