/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the 404 (Not Found) page.
 * @module routes/build404
 */
import { Hono } from 'hono'

import { PATHS } from '../constants'
import { useLayout } from './buildLayout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the 404 page.
 */
const renderNotFound = () => {
  return (
    <div data-testid='404-page-banner'>
      <div>
        <div>
          <div>404</div>
          <h2>Page Not Found</h2>
          <p data-testid='404-message'>That page does not exist.</p>
          <div>
            <a href={PATHS.ROOT} data-testid='home-action'>
              Return Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the 404 route to the app.
 * @param app - Hono app instance
 */
export const build404 = (app: Hono<{ Bindings: Bindings }>): void => {
  app.notFound((c) => c.render(useLayout(c, renderNotFound())))
}
