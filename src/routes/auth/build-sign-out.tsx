/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the sign-out success page.
 * @module routes/auth/buildSignOut
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../build-layout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'

/**
 * Render the JSX for the sign-out success page.
 */
const renderSignOut = () => {
  return (
    <div data-testid='sign-out-page'>
      <div>
        <div>
          <div>
            <span>You have been signed out successfully.</span>
          </div>

          <div>
            <a href={PATHS.ROOT} data-testid='go-home-action'>
              Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Build and register the sign-out success page route.
 * @param app - Hono app instance
 */
export const buildSignOut = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(
    PATHS.AUTH.SIGN_OUT,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      setupNoCacheHeaders(c)

      return c.render(useLayout(c, renderSignOut()))
    }
  )
}
