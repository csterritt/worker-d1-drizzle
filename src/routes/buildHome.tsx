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
    <div
      data-testid='startup-page-banner'
      className='flex flex-col items-center'
    >
      <div className='card w-full max-w-md bg-base-100 shadow-xl mb-6'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold'>Welcome!</h2>
          <p className='py-4'>
            Select one of the options below to navigate through the application.
          </p>
          <div className='card-actions justify-center gap-4'>
            <a
              href={PATHS.PRIVATE}
              className='btn btn-primary'
              data-testid='visit-private-link'
            >
              Go to Private
            </a>
          </div>
        </div>
      </div>
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
