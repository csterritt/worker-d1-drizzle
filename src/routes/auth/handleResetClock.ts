/**
 * Route handler for resetting the server clock (for testing).
 * @module routes/auth/handleResetClock
 */
import { Hono } from 'hono'

import { PATHS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage } from '../../lib/redirects'
import { clearCurrentDelta } from '../../lib/time-access'  // PRODUCTION:REMOVE

/**
 * Attach the reset clock GET route to the app.
 * @param app - Hono app instance
 */
export const handleResetClock = (app: Hono<{ Bindings: Bindings }>): void => {
  // } // PRODUCTION:UNCOMMENT
  // PRODUCTION:STOP
  app.get(PATHS.AUTH.RESET_CLOCK, async (c) => {
    clearCurrentDelta(c)
    // For test: pretend to reset the server clock (no-op in prod)
    // In a real implementation, you would reset the test clock here
    return redirectWithMessage(c, PATHS.HOME, 'Clock reset!')
  })
}
