/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the delete account confirmation page.
 * @module routes/profile/buildDeleteConfirm
 */
import { Context, Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import type { Bindings } from '../../local-types'
import { useLayout } from '../build-layout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { signedInAccess } from '../../middleware/signed-in-access'

/**
 * Render the JSX for the delete account confirmation page.
 */
const renderDeleteConfirm = () => {
  return (
    <div data-testid='delete-confirm-page'>
      <div>
        <div>
          <h2>Are you absolutely sure?</h2>

          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                stroke-width='2'
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
            <span>This action cannot be undone.</span>
          </div>

          <p>
            This will permanently delete your account and all associated data.
            You will not be able to recover your account or sign in with these
            credentials again.
          </p>

          <div>
            <a href={PATHS.PROFILE} data-testid='cancel-delete-action'>
              Cancel
            </a>
            <form method='post' action={PATHS.PROFILE_DELETE}>
              <button type='submit' data-testid='confirm-delete-action'>
                Delete This Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the delete confirmation route to the app.
 * @param app - Hono app instance
 */
export const buildDeleteConfirm = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(
    PATHS.PROFILE_DELETE_CONFIRM,
    secureHeaders(STANDARD_SECURE_HEADERS),
    signedInAccess,
    (c: Context) => {
      setupNoCacheHeaders(c)
      return c.render(useLayout(c, renderDeleteConfirm()))
    }
  )
}
