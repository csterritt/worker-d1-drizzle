/**
 * Route builder for the home path.
 * @module routes/buildHome
 */
import { Hono, Context } from 'hono'
import { PATHS } from '../constants'
import { useLayout } from './buildLayout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the home page.
 * @param c - Hono context
 */
const renderHome = (c: Context) => {
  return (
    <div data-testid='startup-page-banner'>
      <h3>Hello!</h3>
      <p>
        <a href={PATHS.PRIVATE} data-testid='visit-private-link'>
          Go to Private
        </a>
      </p>
      <p>
        <a href={PATHS.COUNT} data-testid='visit-count-link'>
          Go to Count
        </a>
      </p>
    </div>
  )
}

/**
 * Attach the home route to the app.
 * @param app - Hono app instance
 */
export const buildHome = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.HOME, (c) => c.render(useLayout(c, renderHome(c))))
}
