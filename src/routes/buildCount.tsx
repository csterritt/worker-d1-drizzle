/**
 * Route builder for the count path.
 * @module routes/buildCount
 */
import { Hono, Context } from 'hono'

import { PATHS } from '../constants'
import { useLayout } from './buildLayout'
import { Maybe } from 'true-myth'
import { isJust } from 'true-myth/maybe'

/**
 * Render the JSX for the count page.
 * @param c - Hono context
 * @param count
 * @param error
 */
const renderCount = (c: Context, count: number, error?: string) => {
  return (
    <div>
      <h3>Count</h3>
      <p data-testid='count-value'>
        {error ? `Internal problem: ${error}` : count}
      </p>
      <p>
        <a href={PATHS.HOME} data-testid='visit-home-link'>
          Go home
        </a>
      </p>
      <form method='post' action={PATHS.INCREMENT}>
        <button type='submit' data-testid='increment-count-link'>
          Increment the count
        </button>
      </form>
    </div>
  )
}

/**
 * Attach the count route to the app.
 * @param app - Hono app instance
 */
export const buildCount = (
  app: Hono<{ Bindings: CloudflareBindings }>
): void => {
  app.get(PATHS.COUNT, async (c) => {
    let maybeCount: Maybe<any>
    try {
      const results = await c.env.DB.prepare(
        'SELECT count FROM count WHERE id = ?'
      )
        .bind('foo')
        .first()

      if (results && results.count != null) {
        maybeCount = Maybe.of(results.count)
      } else {
        console.log(`got bad count: ${results}`)
        maybeCount = Maybe.nothing()
      }
    } catch (e) {
      console.error('Error getting count', e)
      maybeCount = Maybe.nothing()
    }

    if (isJust(maybeCount)) {
      return c.render(useLayout(c, renderCount(c, maybeCount.value)))
    } else {
      return c.render(useLayout(c, renderCount(c, 0, 'No count found')))
    }
  })
}
