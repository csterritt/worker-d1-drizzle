/**
 * Route builder for the 404 (Not Found) page.
 * @module routes/build404
 */
import { Hono, Context } from 'hono'

import { PATHS } from '../constants'
import { useLayout } from './buildLayout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the 404 page.
 * @param c - Hono context
 */
const renderNotFound = (c: Context) => {
  return (
    <div data-testid='404-page-banner'>
      <h3>404 - Page Not Found</h3>
      <p data-testid='404-message'>That page does not exist.</p>
      <p>
        <a href={PATHS.HOME} data-testid='home-link'>
          Go home
        </a>
      </p>
    </div>
  )
}

/**
 * Attach the 404 route to the app.
 * @param app - Hono app instance
 */
export const build404 = (app: Hono<{ Bindings: Bindings }>): void => {
  app.notFound((c) => c.render(useLayout(c, renderNotFound(c))))
}
