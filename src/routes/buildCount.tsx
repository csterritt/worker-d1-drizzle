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
    <div className='flex flex-col items-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl mb-6'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold'>Count</h2>

          <div className='stats shadow my-4'>
            <div className='stat'>
              <div className='stat-title'>Current Count</div>
              <div
                className='stat-value text-primary'
                data-testid='count-value'
              >
                {error ? `Internal problem: ${error}` : count}
              </div>
            </div>
          </div>

          <div className='card-actions justify-between mt-4'>
            <a
              href={PATHS.HOME}
              className='btn btn-ghost'
              data-testid='visit-home-link'
            >
              Return Home
            </a>
            <form method='post' action={PATHS.INCREMENT}>
              <button
                type='submit'
                className='btn btn-primary'
                data-testid='increment-count-link'
              >
                Increment Count
              </button>
            </form>
          </div>
        </div>
      </div>
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
