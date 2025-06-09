/**
 * Route handler for setting the server clock (for testing).
 * @module routes/auth/handleSetClock
 */
import { Hono } from 'hono'

import { PATHS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage } from '../../lib/redirects'
import { setCurrentDelta } from '../../lib/time-access'

/**
 * Attach the set clock GET route to the app.
 * @param app - Hono app instance
 */
export const handleSetClock = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(`${PATHS.AUTH.SET_CLOCK}/:delta`, async (c) => {
    // return redirectWithMessage(c, PATHS.HOME, '') // PRODUCTION:UNCOMMENT
    // }) // PRODUCTION:UNCOMMENT
    // } // PRODUCTION:UNCOMMENT
    // PRODUCTION:STOP

    const delta = parseInt(c.req.param('delta'))
    setCurrentDelta(c, delta)

    // For test: pretend to set the server clock (no-op in prod)
    // Accept a timestamp or ISO string in the body (for extensibility)
    // In a real implementation, you would update a test clock here
    return redirectWithMessage(c, PATHS.HOME, 'Clock set!')
  })
}
