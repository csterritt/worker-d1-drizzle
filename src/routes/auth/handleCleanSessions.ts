/**
 * Route handler for cleaning all sessions for a user (for testing).
 * @module routes/auth/handleCleanSessions
 */
import { Hono } from 'hono'

import { PATHS } from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithMessage, redirectWithError } from '../../lib/redirects'
import { deleteAllUserSessions } from '../../lib/db-access' // PRODUCTION:REMOVE
import { isErr } from 'true-myth/result'

/**
 * Attach the clean sessions GET route to the app.
 * @param app - Hono app instance
 */
export const handleCleanSessions = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  // } // PRODUCTION:UNCOMMENT
   // PRODUCTION:STOP
  app.get(`${PATHS.AUTH.CLEAN_SESSIONS}/:email`, async (c) => {
    const email = c.req.param('email')

    if (!email) {
      return redirectWithError(c, PATHS.HOME, 'Email is required')
    }

    const result = await deleteAllUserSessions(c.env.PROJECT_DB, email)

    if (isErr(result)) {
      console.error(`Error cleaning sessions: ${result.error}`)
      return redirectWithError(
        c,
        PATHS.HOME,
        `Error cleaning sessions: ${result.error}`
      )
    }

    const count = result.value
    return redirectWithMessage(
      c,
      PATHS.HOME,
      `Successfully deleted ${count} sessions for ${email}`
    )
  })
}
