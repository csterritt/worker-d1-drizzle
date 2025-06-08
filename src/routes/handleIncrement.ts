/**
 * Route handler for the increment path (POST).
 * @module routes/handleIncrement
 */
import { Hono } from 'hono'

import { PATHS } from '../constants'
import { redirectWithMessage, redirectWithError } from '../lib/redirects'
import { IncrementSchema, validateRequest } from '../lib/validators'

/**
 * Attach the increment POST route to the app.
 * @param app - Hono app instance
 */
export const handleIncrement = (
  app: Hono<{ Bindings: CloudflareBindings }>
): void => {
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
      const results = await c.env.DB.prepare(
        'UPDATE count SET count = count + 1 WHERE id = ? returning count'
      )
        .bind('foo')
        .first()

      if (results == null || results.count == null) {
        console.log(`did bad increment: ${results}`)
        return redirectWithError(c, PATHS.COUNT, 'Unable to increment')
      }
    } catch (e: any) {
      console.error('Error incrementing count', e)
      return redirectWithError(
        c,
        PATHS.COUNT,
        e.ToString() || 'Unable to increment'
      )
    }

    // Success, regardless of Maybe
    return redirectWithMessage(c, PATHS.COUNT, 'Increment successful')
  })
}
