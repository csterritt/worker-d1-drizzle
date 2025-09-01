/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for setting the server clock (for testing).
 * @module routes/auth/handleSetClock
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage } from '../../lib/redirects'
import { setCurrentDelta } from '../../lib/time-access' // PRODUCTION:REMOVE

/**
 * Attach the set clock GET route to the app.
 * @param app - Hono app instance
 */
export const handleSetClock = (app: Hono<{ Bindings: Bindings }>): void => {
  // } // PRODUCTION:UNCOMMENT
  // PRODUCTION:STOP
  app.get(
    `${PATHS.AUTH.SET_CLOCK}/:delta`,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      const delta = parseInt(c.req.param('delta'))
      setCurrentDelta(c, delta)

      // For test: pretend to set the server clock (no-op in prod)
      // Accept a timestamp or ISO string in the body (for extensibility)
      // In a real implementation, you would update a test clock here
      return redirectWithMessage(c, PATHS.ROOT, 'Clock set!')
    }
  )
}
