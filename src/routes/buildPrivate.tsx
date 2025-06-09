/**
 * Route builder for the private path.
 * @module routes/buildPrivate
 */
import { Hono, Context } from 'hono'

import { PATHS } from '../constants'
import { Bindings } from '../local-types'
import { useLayout } from './buildLayout'
import { signedInAccess } from '../middleware/signed-in-access'
import { reloadOnBackButton } from '../lib/reload-on-back-button'

/**
 * Render the JSX for the private page.
 * @param c - Hono context
 */
const renderPrivate = (c: Context) => {
  return (
    <div data-testid='private-page-banner'>
      <h3>Private</h3>
      <p>
        <a href={PATHS.HOME} data-testid='visit-home-link'>
          Go home
        </a>
      </p>

      {reloadOnBackButton()}
    </div>
  )
}

/**
 * Attach the private route to the app.
 * @param app - Hono app instance
 */
export const buildPrivate = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.PRIVATE, signedInAccess, (c) =>
    c.render(useLayout(c, renderPrivate(c)))
  )
}
