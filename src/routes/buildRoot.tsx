/**
 * Route builder for the root path.
 * @module routes/buildRoot
 */
import { Hono, Context } from 'hono'
import { PATHS } from '../constants'
import { useLayout } from './buildLayout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the root page.
 * @param c - Hono context
 */
const renderRoot = (c: Context) => {
  return (
    <div data-testid='startup-page-banner'>
      <h3 id='heading'>Worker, D1, Drizzle Project</h3>
      <p>
        <a href={PATHS.HOME}>Home</a>
      </p>
    </div>
  )
}

/**
 * Attach the root route to the app.
 * @param app - Hono app instance
 */
export const buildRoot = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.ROOT, (c) => c.render(useLayout(c, renderRoot(c))))
}
