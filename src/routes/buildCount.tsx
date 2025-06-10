/**
 * Route builder for the count path.
 * @module routes/buildCount
 */
import { Hono, Context } from 'hono'

import { COOKIES, PATHS } from '../constants'
import { Bindings, CountAndDecrement } from '../local-types'
import { useLayout } from './buildLayout'
import { Maybe } from 'true-myth'
import { isJust } from 'true-myth/maybe'
import { findCountById } from '../lib/db-access'
import { getCookie } from 'hono/cookie'
import { isErr } from 'true-myth/result'

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
export const buildCount = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.COUNT, async (c) => {
    let maybeCount: Maybe<any>
    try {
      // Pass the raw D1Database instance directly from env
      const db = c.env.PROJECT_DB

      // Check for DB_FAIL_COUNT cookie using getCookie // PRODUCTION:REMOVE
      let dbFailCount: CountAndDecrement | undefined = undefined
      const failCountCookie = getCookie(c, COOKIES.DB_FAIL_COUNT) // PRODUCTION:REMOVE
      // PRODUCTION:REMOVE-NEXT-LINE
      if (failCountCookie && !isNaN(Number(failCountCookie))) {
        dbFailCount = new CountAndDecrement(Number(failCountCookie)) // PRODUCTION:REMOVE
      } // PRODUCTION:REMOVE
      console.log('========> dbFailCount', dbFailCount)

      const countResult = await findCountById(
        c.env.PROJECT_DB,
        'foo',
        dbFailCount
      )
      if (isErr(countResult)) {
        return c.render(renderCount(c, 0, `Database error`))
      }

      maybeCount = countResult.value
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
