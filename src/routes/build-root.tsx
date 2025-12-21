/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the root path.
 * @module routes/buildRoot
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { PATHS, STANDARD_SECURE_HEADERS } from '../constants'
import { useLayout } from './build-layout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the root page.
 */
const renderRoot = () => {
  return (
    <div data-testid='startup-page-banner'>
      <div>
        <div id='container'>
          <h2>Welcome!</h2>
          <h3 id='heading'>Worker, D1, Drizzle Project</h3>
          <div>
            <a href={PATHS.PRIVATE} data-testid='visit-private-action'>
              Protected Content
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the root route to the app.
 * @param app - Hono app instance
 */
export const buildRoot = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.ROOT, secureHeaders(STANDARD_SECURE_HEADERS), (c) =>
    c.render(useLayout(c, renderRoot()))
  )
}
