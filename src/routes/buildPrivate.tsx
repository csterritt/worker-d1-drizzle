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
