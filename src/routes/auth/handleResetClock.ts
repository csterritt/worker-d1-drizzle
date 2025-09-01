/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for resetting the server clock (for testing).
 * @module routes/auth/handleResetClock
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage } from '../../lib/redirects'
import { clearCurrentDelta } from '../../lib/time-access' // PRODUCTION:REMOVE

/**
 * Attach the reset clock GET route to the app.
 * @param app - Hono app instance
 */
export const handleResetClock = (app: Hono<{ Bindings: Bindings }>): void => {
  // } // PRODUCTION:UNCOMMENT
  // PRODUCTION:STOP
  app.get(
    PATHS.AUTH.RESET_CLOCK,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      clearCurrentDelta(c)
      // For test: pretend to reset the server clock (no-op in prod)
      // In a real implementation, you would reset the test clock here
      return redirectWithMessage(c, PATHS.ROOT, 'Clock reset!')
    }
  )
}
