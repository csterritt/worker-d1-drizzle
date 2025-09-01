/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for setting DB failure count (for testing).
 * @module routes/handleSetDbFailures
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../constants'
import { Bindings } from '../local-types'
import { redirectWithMessage } from '../lib/redirects'
import { addCookie } from '../lib/cookie-support'

/**
 * Attach the set DB failures GET route to the app.
 * @param app - Hono app instance
 */
export const handleSetDbFailures = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  // } // PRODUCTION:UNCOMMENT
  // PRODUCTION:STOP
  app.get(
    `${PATHS.AUTH.SET_DB_FAILURES}/:name/:times`,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      const name = c.req.param('name')
      if (!name || name.trim() === '') {
        return redirectWithMessage(c, PATHS.ROOT, 'Invalid name parameter')
      }

      const times = c.req.param('times')
      if (!times || isNaN(Number(times))) {
        return redirectWithMessage(c, PATHS.ROOT, 'Invalid times parameter')
      }

      addCookie(c, name, times)

      return redirectWithMessage(c, PATHS.ROOT, ``)
    }
  )
}
