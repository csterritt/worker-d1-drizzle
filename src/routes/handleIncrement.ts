/**
 * Route handler for the increment path (POST).
 * @module routes/handleIncrement
 */
import { Hono } from 'hono'

import { PATHS } from '../constants'
import { redirectWithMessage, redirectWithError } from '../lib/redirects'
import { IncrementSchema, validateRequest } from '../lib/validators'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

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
      // Get DB client from context
      const db = c.get('db')
      
      // Update using Drizzle ORM
      const result = await db.update(schema.count)
        .set({ count: sql`${schema.count.count} + 1` })
        .where(eq(schema.count.id, 'foo'))
        .returning({ count: schema.count.count })
        .get()
      
      if (result == null || result.count == null) {
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
