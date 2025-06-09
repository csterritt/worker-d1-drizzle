/**
 * Route handler for the increment path (POST).
 * @module routes/handleIncrement
 */
import { Hono } from 'hono'

import { PATHS } from '../constants'
import { Bindings } from '../local-types'
import { redirectWithMessage, redirectWithError } from '../lib/redirects'
import { IncrementSchema, validateRequest } from '../lib/validators'
import { incrementCountById } from '../lib/db-access'

/**
 * Attach the increment POST route to the app.
 * @param app - Hono app instance
 */
export const handleIncrement = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(PATHS.INCREMENT, async (c) => {
    // Validate the request using Valibot schema
    const formData = await c.req.parseBody()
    const [isValid, _validatedData, errorMessage] = validateRequest(
      formData,
      IncrementSchema
    )

    if (!isValid) {
      return redirectWithError(c, PATHS.COUNT, errorMessage || 'Invalid input')
    }

    try {
      const db = c.env.PROJECT_DB

      const result = await incrementCountById(db, 'foo')

      if (result.isErr || result.value.isNothing || result.value.value !== 1) {
        console.log(`did bad increment: ${result}`)
        return redirectWithError(c, PATHS.COUNT, 'Unable to increment')
      }
    } catch (e: any) {
      console.error('Error incrementing count', e)
      return redirectWithError(
        c,
        PATHS.COUNT,
        e.toString() || 'Unable to increment'
      )
    }

    // Success, regardless of Maybe
    return redirectWithMessage(c, PATHS.COUNT, 'Increment successful')
  })
}
