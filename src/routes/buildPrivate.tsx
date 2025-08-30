/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the private path.
 * @module routes/buildPrivate
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../constants'
import { Bindings } from '../local-types'
import { useLayout } from './buildLayout'
import { signedInAccess } from '../middleware/signed-in-access'

/**
 * Render the JSX for the private page.
 */
const renderPrivate = () => {
  return (
    <div
      data-testid='private-page-banner'
      className='flex flex-col items-center'
    >
      <div className='card w-full max-w-md bg-base-100 shadow-xl mb-6'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold'>Private Area</h2>
          <p className='py-4'>
            This is a protected area that requires authentication to access.
          </p>
          <div className='card-actions justify-center'>
            <a
              href={PATHS.ROOT}
              className='btn btn-ghost'
              data-testid='visit-home-link'
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the private route to the app.
 * @param app - Hono app instance
 */
export const buildPrivate = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(
    PATHS.PRIVATE,
    secureHeaders(STANDARD_SECURE_HEADERS),
    signedInAccess,
    (c) => c.render(useLayout(c, renderPrivate()))
  )
}
